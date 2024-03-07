import dotenv from 'dotenv';
import db, { Agent, Game, Hop, Line, Station, Train } from './models';
import { Model, Op, Sequelize } from 'sequelize';
import { logger } from './logging'

dotenv.config();

class MessageLog {
  messages: string[] = []

  append(message: string) {
    this.messages.push(message)
  }

  retrieveAll() {
    return this.messages
  }
}

type Context = {
  gameId: number
  gameName: string
  turnNumber: number
  lines: Model<Line>[]
  trains: Model<Train>[]
  hops: Model<Hop>[]
  stations: Model<Station>[]
  agents: Model<Agent>[]
  messageLog: MessageLog
}

const runOnce: boolean = Boolean( process.env.RUN_ONCE && process.env.RUN_ONCE.toLowerCase() !== 'false' )
const tickInterval: number = parseInt(process.env.TICK_INTERVAL || '5000', 10)

function tickTravelingTrain(
  train: Model<Train>,
  { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, messageLog }: Context
) {
  const hop = hops.find((hop) => hop.dataValues.id === train.dataValues.hopId)
  if (hop) {
    if (train.dataValues.distance >= hop.dataValues.length) {
      // Train has reached end of hop
      const station = stations.find((station) => station.dataValues.id === hop.dataValues.tailId)
      if (station) {
        // Filter out current train
        // Only consider trains of the same line
        // Filter down to trains in current station
        const otherTrain = trains
          .filter((otherTrain) => otherTrain.dataValues.id !== train.dataValues.id)
          .filter((otherTrain) => otherTrain.dataValues.lineId !== train.dataValues.lineId)
          .find((otherTrain) => otherTrain.dataValues.stationId === station.dataValues.id)
        if (otherTrain) {
          // There's another train of the same line already in the station
          logger.warn(
            {
              gameName,
              turnNumber,
              trainName: train.dataValues.name,
              otherTrainName: otherTrain.dataValues.name,
              stationName: station.dataValues.name,
              hopName: hop.dataValues.name
            },
            'Traveling train is attempting to stop in station, but there is another train! Holding...'
          )
          messageLog.append(`Traveling train ${train.dataValues.title} is attempting to stop at ${station.dataValues.title}, but ${train.dataValues.title} is in the way!`)
        }
        else {
          // Found a station to transfer to. Will transfer
          logger.info(
            {
              gameName,
              turnNumber,
              trainName: train.dataValues.name,
              stationName: station.dataValues.name,
              hopName: hop.dataValues.name
            },
            'Traveling train is stopping in station.'
          )
          messageLog.append(`Traveling train ${train.dataValues.title} is stopping at ${station.dataValues.title}.`)
          train.set('hopId', null)
          train.set('stationId', station.dataValues.id)
          train.set('currentWaitTime', 0)
          train.set('distance', 0)
        }
      }
      else {
        // Could not find station to transfer to. Hold position.
        logger.warn(
          {
            gameName,
            turnNumber,
            hopName: hop.dataValues.name,
            trainName: train.dataValues.name
          },
          'Traveling train could not find a station to transfer to. Holding...'
        )
        messageLog.append(`Traveling train ${train.dataValues.title} could not find station to transfer to! Holding...`)
      }
    }
    else {
      // Traveling normally

      // Filter out current train
      // Only consider trains of the same line
      // Filter down to trains in the same hop
      // Filter down to trains ahead of current train
      // Filter down to trains which *would be behind* of current train, if it moves
      const overtakenTrain = trains
        .filter((otherTrain) => otherTrain.dataValues.id !== train.dataValues.id)
        .filter((otherTrain) => otherTrain.dataValues.lineId !== train.dataValues.lineId)
        .filter((otherTrain) => otherTrain.dataValues.hopId === train.dataValues.hopId)
        .filter((otherTrain) => train.dataValues.distance < otherTrain.dataValues.distance)
        .find((otherTrain) => train.dataValues.distance + train.dataValues.speed >= otherTrain.dataValues.distance)
      if (overtakenTrain) {
        // Train would overtake another train. Holding position
        logger.warn(
          {
            gameName,
            turnNumber,
            hopName: hop.dataValues.name,
            trainName: train.dataValues.name,
            otherTrainName: overtakenTrain.dataValues.name,
          },
          'Traveling train would overtake another train. Holding...'
        )
        messageLog.append(`Traveling train ${train.dataValues.title} would overtake ${overtakenTrain.dataValues.title}! Holding...`)
      }
      else {
        // Train traveling normally
        train.set('distance', train.dataValues.distance + train.dataValues.speed)
        logger.info(
          {
            gameName,
            turnNumber,
            trainName: train.dataValues.name,
            hopName: hop.dataValues.name
          },
          'Traveling train traveling normally'
        )
        messageLog.append(`Traveling train ${train.dataValues.title} is traveling normally.`)
      }
    }
  } else {
    logger.warn(
      {
        gameName,
        turnNumber,
        trainName: train.dataValues.name
      },
      'Traveling train has no hops to hop on!',
      train.dataValues.name
    )
    messageLog.append(`Traveling train ${train.dataValues.title} has no hops to transfer to!`)
  }
}

function tickStationedTrain(
  train: Model<Train>,
  { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, messageLog }: Context
) {
  const station = stations.find((station) => station.dataValues.id === train.dataValues.stationId)
  if (station) {
    if (station.dataValues.virtual) {
      // Trains depart virtual stations immediately

      // Filter down to hops heading from this station
      // Filter down to hops of same line as train
      // Filter out other hops which have trains at distance 0
      const nextHops = hops
        .filter((hop) => hop.dataValues.headId === station.dataValues.id)
        .filter((hop) => hop.dataValues.lineId === train.dataValues.lineId)
        .filter((hop) => (
          // Find all trains that *don't* match the criteria:
          // * Filter out current train
          // * Only consider trains of the same line
          // * Filter down to trains in the same hop
          // * Filter down to trains that haven't moved in the hop
          !trains
            .filter((otherTrain) => otherTrain.dataValues.id !== train.dataValues.id)
            .filter((otherTrain) => otherTrain.dataValues.lineId !== hop.dataValues.lineId)
            .filter((otherTrain) => otherTrain.dataValues.hopId === hop.dataValues.id)
            .some((otherTrain) => otherTrain.dataValues.distance === 0)
        ))
      const hop = nextHops[Math.floor(Math.random() * nextHops.length)]
      if (hop) {
        train.set('hopId', hop.dataValues.id)
        train.set('stationId', null)
        train.set('currentWaitTime', 0)
        train.set('distance', 0)
        logger.info(
          {
            gameName,
            turnNumber,
            trainName: train.dataValues.name,
            stationName: station.dataValues.name,
            hopName: hop.dataValues.name
          },
          'Stationed train deparating virtual station!'
        )
        messageLog.append(`Stationed train ${train.dataValues.title} is departing service station ${station.dataValues.title}.`)
      }
      else {
        logger.warn(
          {
            gameName,
            turnNumber,
            trainName: train.dataValues.name,
            stationName: station.dataValues.name
          },
          'Stationed train has no hops to depart from in this virtual station!'
        )
        messageLog.append(`Stationed train ${train.dataValues.title} has no hops to transfer to from ${station.dataValues.title}!`)
      }
    }
    else {
      if (train.dataValues.currentWaitTime >= train.dataValues.maxWaitTime) {
        // Train is departing

        // Filter down to hops heading from this station
        // Filter down to hops of same line as train
        // Filter out other hops which have trains at distance 0
        const nextHops = hops
          .filter((hop) => hop.dataValues.headId === station.dataValues.id)
          .filter((hop) => hop.dataValues.lineId === train.dataValues.lineId)
          .filter((hop) => (
            // Find all trains that *don't* match the criteria:
            // * Filter out current train
            // * Only consider trains of the same line
            // * Filter down to trains in the same hop
            // * Filter down to trains that haven't moved in the hop
            !trains
              .filter((otherTrain) => otherTrain.dataValues.id !== train.dataValues.id)
              .filter((otherTrain) => otherTrain.dataValues.lineId !== hop.dataValues.lineId)
              .filter((otherTrain) => otherTrain.dataValues.hopId === hop.dataValues.id)
              .some((otherTrain) => otherTrain.dataValues.distance === 0)
          ))
        const hop = nextHops[Math.floor(Math.random() * nextHops.length)]
        if (hop) {
          train.set('hopId', hop.dataValues.id)
          train.set('stationId', null)
          train.set('currentWaitTime', 0)
          train.set('distance', 0)
          logger.info(
            {
              gameName,
              turnNumber,
              trainName: train.dataValues.name,
              stationName: train.dataValues.name,
              hopName: hop.dataValues.name
            },
            'Departing train jumped to hop from station!'
          )
          messageLog.append(`Stationed train ${train.dataValues.title} is departing from ${station.dataValues.title}.`)
        }
        else {
          logger.warn(
            {
              gameName,
              turnNumber,
              trainName: train.dataValues.name,
              stationName: station.dataValues.name
            },
            'Stationed train wants to depart but has no hops to depart on!'
          )
          messageLog.append(`Stationed train ${train.dataValues.title} wants to depart ${station.dataValues.title} but there are no hops to depart from!`)
        }
      }
      else {
        // Train is waiting
        train.set('currentWaitTime', train.dataValues.currentWaitTime + 1)
        logger.info(
          {
            gameName,
            turnNumber,
            trainName: train.dataValues.name,
            stationName: station.dataValues.name
          },
          'Stationed train is waiting in station'
        )
        messageLog.append(`Stationed train ${train.dataValues.title} is waiting in ${station.dataValues.title}.`)
      }
    }
  }
  else {
    logger.error(
      {
        gameName,
        turnNumber,
        trainName: train.dataValues.name
      },
      'Stationed train has no station!'
    )
    console.log(train)
    console.log(stations)
    messageLog.append(`Stationed train ${train.dataValues.title} has no station!`)
  }
}

function tickTravelingAgent(
  agent: Model<Agent>,
  { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, messageLog }: Context
) {
  const train = trains.find((train) => train.dataValues.id === agent.dataValues.trainId)
  if (train) {
    const station = stations.find((station) => station.dataValues.id === train.dataValues.stationId)
    if (station) {
      if (station.dataValues.end) {
        // Agent on stationed train has reached destination and disembarks train
        logger.info(
          {
            gameName,
            turnNumber,
            agentName: agent.dataValues.name,
            trainName: train.dataValues.name,
            stationName: station.dataValues.name
          },
          'Traveling agent has found their destination! Disembarking...'
        )
        messageLog.append(`Traveling agent ${agent.dataValues.title} has found their destination, ${station.dataValues.title} and is disembarking from train ${station.dataValues.title}.`)
        agent.set('trainId', null)
        agent.set('stationId', station.dataValues.id)
      }
      else {
        // Agent on stationed train has not yet reached destination
        const mightDisembarkTrain = Math.random() < 0.5;
        if (mightDisembarkTrain) {
          // Agent on stationed train is disembarking at station
          if (station.dataValues.virtual) {
            // Agents will not disembark from virtual stations
            logger.warn({
              gameName,
              turnNumber,
              agentName: agent.dataValues.name,
              trainName: train.dataValues.name,
              stationName: station.dataValues.name
            },
              'Traveling agent will not be disembarking train to virtual station'
            )
            messageLog.append(`Traveling agent ${agent.dataValues.title} will not be disembarking ${train.dataValues.title} at service station ${station.dataValues.title}!`)
          } else {
            // Agent disembarks train
            logger.info(
              {
                gameName,
                turnNumber,
                agentName: agent.dataValues.name,
                trainName: train.dataValues.name,
                stationName: station.dataValues.name
              },
              'Traveling agent is disembarking train to station'
            )
            messageLog.append(`Traveling agent ${agent.dataValues.title} is disembarking ${train.dataValues.title} at station ${station.dataValues.title}.`)
            agent.set('trainId', null)
            agent.set('stationId', station.dataValues.id)
          }
        }
        else {
          // Agent on stationed train is staying put
          logger.info(
            {
              gameName,
              turnNumber,
              agentName: agent.dataValues.name,
              trainName: train.dataValues.name,
              stationName: station.dataValues.name
            },
            'Traveling agent is staying on stationed train'
          )
          messageLog.append(`Traveling agent ${agent.dataValues.title} is staying on ${train.dataValues.title} at station ${station.dataValues.title}.`)
        }
      }
    }
    else {
      // Agent on traveling train is traveling
      logger.info(
        {
          gameName,
          turnNumber,
          agentName: agent.dataValues.name,
          trainName: train.dataValues.name
        },
        'Traveling agent is traveling on train'
      )
      messageLog.append(`Traveling agent ${agent.dataValues.title} is traveling on ${train.dataValues.title}.`)
    }
  }
  else {
    // Error state. Traveling agent without a train
    logger.error(
      {
        gameName,
        turnNumber,
        agentName: agent.dataValues.name
      },
      'Traveling agent is traveling without a train!'
    )
    messageLog.append(`Traveling agent ${agent.dataValues.title} is traveling without a train!`)
  }
}

function tickStationedAgent(
  agent: Model<Agent>,
  { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, messageLog }: Context
) {
  const station = stations.find((station) => station.dataValues.id === agent.dataValues.stationId)
  if (station) {
    if (station.dataValues.end) {
      // Stationed agent in a station with no trains, is waiting
      logger.info(
        {
          gameName,
          turnNumber,
          agentName: agent.dataValues.name,
          stationName: station.dataValues.name
        },
        'Stationed agent is waiting at destination'
      )
      messageLog.append(`Stationed agent ${agent.dataValues.title} is waiting at their destination, ${station.dataValues.title}.`)
    }
    else {
      const trainsInStation = trains.filter((train) => station.dataValues.id === train.dataValues.stationId)
      const trainToBoard = trainsInStation[Math.floor(Math.random() * trainsInStation.length)]
      if (trainsInStation.length > 0) {
        const mightBoardTrain = Math.random() < 0.5; // TODO: Change this
        if (mightBoardTrain) {
          // Stationed agent choosing to board a train
          if (station.dataValues.virtual) {
            // If station is virtual, agent will not board train
            logger.error(
              {
                gameName,
                turnNumber,
                agentName: agent.dataValues.name,
                stationName: station.dataValues.name,
                trainName: trainToBoard.dataValues.name
              },
              'Stationed agent attempted to board train, but is trapped in virtual station'
            )
            messageLog.append(`Stationed agent ${agent.dataValues.title} attempted to board ${trainToBoard.dataValues.title}, but is trapped at service station ${station.dataValues.title}!`)
          }
          else {
            // Stationed agent in a station with trains, will board a train
            logger.info(
              {
                gameName,
                turnNumber,
                agentName: agent.dataValues.name,
                stationName: station.dataValues.name,
                trainName: trainToBoard.dataValues.name
              },
              'Stationed at station is boarding train'
            )
            messageLog.append(`Stationed agent ${agent.dataValues.title} is boarding ${trainToBoard.dataValues.title} from ${station.dataValues.title}!`)
            agent.set('stationId', null)
            agent.set('trainId', trainToBoard.dataValues.id)
          }
        }
        else {
          // Stationed agent in a station with trains, is waiting
          logger.info(
            {
              gameName,
              turnNumber,
              agentName: agent.dataValues.name,
              stationName: station.dataValues.name
            },
            'Stationed agent is waiting at station with waiting trains'
          )
          messageLog.append(`Stationed agent ${agent.dataValues.title} is waiting for trains in ${station.dataValues.title}.`)
        }
      }
      else {
        // Stationed agent in a station with no trains, is waiting
        logger.info(
          {
            gameName,
            turnNumber,
            agentName: agent.dataValues.name,
            stationName: station.dataValues.name
          },
          'Stationed agent is waiting at station'
        )
        messageLog.append(`Stationed agent ${agent.dataValues.title} is waiting at ${station.dataValues.title}.`)
      }
    }
  }
  else {
    logger.error(
      {
        gameName,
        turnNumber,
        agentName: agent.dataValues.name
      },
      'Stationed agent is stationed, but the station cannot be found'
    )
    messageLog.append(`Stationed agent ${agent.dataValues.title} is without a station!`)
  }
}

async function tickGameTurn(gameId: number, gameName: string, turnNumber: number, messageLog: MessageLog) {
  const lines = await db.models.Line.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const trains = await db.models.Train.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const hops = await db.models.Hop.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const stations = await db.models.Station.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const agents = await db.models.Agent.findAll({ where: { gameId: { [Op.eq]: gameId } } })

  const context = { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, messageLog }

  // Train phase
  for (let train of trains) {
    // Traveling train
    if (train.dataValues.hopId) {
      tickTravelingTrain(train, context)
      await train.save()
    }
    // Stationed train
    else if (train.dataValues.stationId) {
      tickStationedTrain(train, context)
      await train.save()
    }
    // A train is "out-of-bounds" if not hopping or stationed.
    else {
      logger.error({ gameName, turnNumber, trainName: train.dataValues.name }, 'Train is out-of-bounds. Skipping!')
    }
  }

  // Agent phase
  for (let agent of agents) {
    // Traveling agent
    if (agent.dataValues.trainId) {
      tickTravelingAgent(agent, context)
      await agent.save()
    }
    // Stationed agent
    else if (agent.dataValues.stationId) {
      tickStationedAgent(agent, context)
      await agent.save()
    }
    // An agent is "out-of-bounds" if not traveling or stationed.
    else {
      logger.error({ gameName, turnNumber, agentName: agent.dataValues.name }, 'Agent is out-of-bounds. Skipping!')
    }
  }
}

async function tickGame(game: Model<Game>) {
  const gameName = game.dataValues.name
  const gameId = game.dataValues.id
  try {
    await db.transaction(async (t) => {
      // Calculate current turn number
      const previousGameTurn = await db.models.GameTurn.findOne({
        order: [['turnNumber', 'DESC']],
        where: { gameId }
      })
      const previousTurnNumber = previousGameTurn?.dataValues.turnNumber || 0
      const turnNumber = previousTurnNumber + 1
      // Tick the game
      logger.info({ gameName, turnNumber }, 'Began processing tick for game...')
      const messageLog = new MessageLog()
      await tickGameTurn(gameId, gameName, turnNumber, messageLog)
      const messages = messageLog.retrieveAll()
      await db.models.Message.bulkCreate(messages.map((message) => ({ gameId, turnNumber, message })))
      logger.info({ gameName, turnNumber }, 'Finished processing tick for game!')
      // Pull up the updated game data
      const newGame = await db.models.Game.findOne({
        include: [
          { model: db.models.Station, as: 'stations' },
          { model: db.models.Line, as: 'lines' },
          { model: db.models.Hop, as: 'hops' },
          { model: db.models.Train, as: 'trains' },
          { model: db.models.Agent, as: 'agents' },
        ],
        where: { name: gameName }
      })
      // Store pre-digested game turn data
      await db.models.GameTurn.create({
        gameId,
        turnNumber,
        data: newGame
      })
      logger.info({ gameName, turnNumber }, 'Finished caching game turn data!')
      
      game.dataValues.turnNumber = turnNumber
      game.save()
    });
    logger.info({ gameName }, 'Transaction committed for game!')
  } catch (error) {
    logger.error({ gameName, error }, 'Transaction rolled back due to error!')
  }
}

async function tick() {
  logger.info('Ticker starting...')

  // Initialize DB
  await db.sync({ force: false });

  logger.info('Ticker started!...')
  const games: Model<Game>[] = await db.models.Game.findAll({ attributes: ['id', 'name'] })
  const promises = games.map((game) => tickGame(game))
  await Promise.allSettled(promises)
  logger.info('Ticker finished!')
}

const timeout = (interval: number) => new Promise((res) => setTimeout(res, interval))

async function main() {
  while (true) {
    await tick()
    logger.info('Ticker will tick again in %sms!', tickInterval)
    if (runOnce) {
      break;
    }
    await timeout(tickInterval)
  }
  process.exit()
}

main()