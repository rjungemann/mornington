import dotenv from 'dotenv';
import db, { Hop, Station } from './models';
import { Model, Op, Sequelize } from 'sequelize';
import { logger } from './logging'

dotenv.config();

const runOnce: boolean = Boolean( process.env.RUN_ONCE && process.env.RUN_ONCE.toLowerCase() !== 'false' )
const tickInterval: number = parseInt(process.env.TICK_INTERVAL || '5000', 10)

function tickTravelingTrain(
  train: Model<any, any>,
  { gameId, gameName, turnNumber, lines, trains, hops, stations, agents }:
    { gameId: number, gameName: string, turnNumber: number, lines: Model<any, any>[], trains: Model<any, any>[], hops: Model<any, any>[], stations: Model<any, any>[], agents: Model<any, any>[] }
) {
  const hop = hops.find((hop) => hop.dataValues.id === train.dataValues.hopId)
  if (hop) {
    if (train.dataValues.distance >= hop.dataValues.length) {
      // Train has reached end of hop
      const station = stations.find((station) => station.dataValues.id === hop.dataValues.tailId)
      if (station) {
        const otherTrain = trains
          // Filter out current train
          .filter((otherTrain) => otherTrain.dataValues.id !== train.dataValues.id)
          // Only consider trains of the same line
          .filter((otherTrain) => otherTrain.dataValues.lineId !== train.dataValues.lineId)
          // Filter down to trains in current station
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
            'Traveling train is attempting to stop in station, but there is another train. Holding...'
          )
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
            'Traveling train is stopping in station'
          )
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
      }
    }
    else {
      // Traveling normally
      const overtakenTrain = trains
        // Filter out current train
        .filter((otherTrain) => otherTrain.dataValues.id !== train.dataValues.id)
        // Only consider trains of the same line
        .filter((otherTrain) => otherTrain.dataValues.lineId !== train.dataValues.lineId)
        // Filter down to trains in the same hop
        .filter((otherTrain) => otherTrain.dataValues.hopId === train.dataValues.hopId)
        // Filter down to trains ahead of current train 
        .filter((otherTrain) => train.dataValues.distance < otherTrain.dataValues.distance)
        // Filter down to trains which *would be behind* of current train, if it moves
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
  }
}

function tickStationedTrain(
  train: Model<any, any>,
  { gameId, gameName, turnNumber, lines, trains, hops, stations, agents }:
    { gameId: number, gameName: string, turnNumber: number, lines: Model<any, any>[], trains: Model<any, any>[], hops: Model<any, any>[], stations: Model<any, any>[], agents: Model<any, any>[] }
) {
  const station = stations.find((station) => station.dataValues.id === train.dataValues.stationId)
  if (station) {
    if (station.dataValues.virtual) {
      // Trains depart virtual stations immediately
      const nextHops = hops
        // Filter down to hops heading from this station
        .filter((hop) => hop.dataValues.headId === station.dataValues.id)
        // Filter down to hops of same line as train
        .filter((hop) => hop.dataValues.lineId === train.dataValues.lineId)
        // Filter out other hops which have trains at distance 0
        .filter((hop) => (
          !trains
            // Filter out current train
            .filter((otherTrain) => otherTrain.dataValues.id !== train.dataValues.id)
            // Only consider trains of the same line
            .filter((otherTrain) => otherTrain.dataValues.lineId !== hop.dataValues.lineId)
            // Filter down to trains in the same hop
            .filter((otherTrain) => otherTrain.dataValues.hopId === hop.dataValues.hopId)
            // Filter down to trains in the same hop
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
      }
    }
    else {
      if (train.dataValues.currentWaitTime >= train.dataValues.maxWaitTime) {
        // Train is departing
        const nextHops = hops
          // Filter down to hops heading from this station
          .filter((hop) => hop.dataValues.headId === station.dataValues.id)
          // Filter down to hops of same line as train
          .filter((hop) => hop.dataValues.lineId === train.dataValues.lineId)
          // Filter out other hops which have trains at distance 0
          .filter((hop) => (
            !trains
              // Filter out current train
              .filter((otherTrain) => otherTrain.dataValues.id !== train.dataValues.id)
              // Only consider trains of the same line
              .filter((otherTrain) => otherTrain.dataValues.lineId !== hop.dataValues.lineId)
              // Filter down to trains in the same hop
              .filter((otherTrain) => otherTrain.dataValues.hopId === hop.dataValues.hopId)
              // Filter down to trains in the same hop
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
  }
}

function tickTravelingAgent(
  agent: Model<any, any>,
  { gameId, gameName, turnNumber, lines, trains, hops, stations, agents }:
    { gameId: number, gameName: string, turnNumber: number, lines: Model<any, any>[], trains: Model<any, any>[], hops: Model<any, any>[], stations: Model<any, any>[], agents: Model<any, any>[] }
) {
  const train = trains.find((train) => train.dataValues.id === agent.dataValues.trainId)
  if (train) {
    const station = stations.find((station) => station.dataValues.id === train.dataValues.stationId)
    if (station) {
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
  }
}

function tickStationedAgent(
  agent: Model<any, any>,
  { gameId, gameName, turnNumber, lines, trains, hops, stations, agents }:
    { gameId: number, gameName: string, turnNumber: number, lines: Model<any, any>[], trains: Model<any, any>[], hops: Model<any, any>[], stations: Model<any, any>[], agents: Model<any, any>[] }
) {
  const station = stations.find((station) => station.dataValues.id === agent.dataValues.stationId)
  if (station) {
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
  }
}

async function tickGameTurn(gameId: number, gameName: string, turnNumber: number) {
  const lines = await db.models.Line.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const trains = await db.models.Train.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const hops = await db.models.Hop.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const stations = await db.models.Station.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const agents = await db.models.Agent.findAll({ where: { gameId: { [Op.eq]: gameId } } })

  // Train phase
  for (let train of trains) {
    // Traveling train
    if (train.dataValues.hopId) {
      tickTravelingTrain(train, { gameId, gameName, turnNumber, lines, trains, hops, stations, agents })
      await train.save()
    }
    // Stationed train
    else if (train.dataValues.stationId) {
      tickStationedTrain(train, { gameId, gameName, turnNumber, lines, trains, hops, stations, agents })
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
      tickTravelingAgent(agent, { gameId, gameName, turnNumber, lines, trains, hops, stations, agents })
      await agent.save()
    }
    // Stationed agent
    else if (agent.dataValues.stationId) {
      tickStationedAgent(agent, { gameId, gameName, turnNumber, lines, trains, hops, stations, agents })
      await agent.save()
    }
    // An agent is "out-of-bounds" if not traveling or stationed.
    else {
      logger.error({ gameName, turnNumber, agentName: agent.dataValues.name }, 'Agent is out-of-bounds. Skipping!')
    }
  }
}

async function tickGame(game: Model<any, any>) {
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
      await tickGameTurn(gameId, gameName, turnNumber)
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
  const games = await db.models.Game.findAll({ attributes: ['id', 'name'] })
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