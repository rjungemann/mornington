import dotenv from 'dotenv';
import db, { Hop, Station } from './models';
import { Model, Op, Sequelize } from 'sequelize';
import { logger } from './logging'

dotenv.config();

const runOnce: boolean = Boolean( process.env.RUN_ONCE && process.env.RUN_ONCE.toLowerCase() !== 'false' )
const tickInterval: number = parseInt(process.env.TICK_INTERVAL || '5000', 10)

function tickHoppingTrainTraveling(
  train: Model<any, any>,
  { gameId, lines, trains, hops, stations, agents }:
    { gameId: number, lines: Model<any, any>[], trains: Model<any, any>[], hops: Model<any, any>[], stations: Model<any, any>[], agents: Model<any, any>[] }
) {
  // Train has finished traveling over the hop
  const hopId: number = train.dataValues.hopId!
  const hop: Hop = hops.find((hop) => hop.dataValues.id === hopId)! as Hop
  const station: Station = stations.find((station) => station.dataValues.id === hop.dataValues.tailId)! as Station
  if (station.dataValues.virtual) {
    // Virtual station, immediately transfer to next hop
    logger.info({ gameId, stationName: station.dataValues.name }, 'Hopping to virtual station "%s"', station.dataValues.name)
    const nextHops = hops
      // Get hops whose station is the head of the hop
      .filter((hop) => hop.dataValues.headId === station.dataValues.id)
      // Get hops whose line matches the train's line
      .filter((hop) => hop.dataValues.lineId === train.dataValues.lineId)
      // // Reject any hops that have trains at 0 distance along them
      // .filter((hop) => (
      //   trains.some((train) => train.dataValues.hopId === hop.dataValues.id && train.dataValues.distance !== 0)
      // ))
    const nextHop = nextHops[Math.floor(nextHops.length * Math.random())]
    if (nextHop) {
      // Found a valid hop, jumping to it
      logger.info({ gameId, stationName: station.dataValues.name }, 'Hopping from virtual station "%s"', station.dataValues.name)
      train.set('hopId', nextHop.dataValues.id)
      train.set('stationId', null)
      train.set('currentWaitTime', 0)
      train.set('distance', 0)
    } else {
      // No valid hops, stuck in virtual station
      logger.warn({ gameId, stationName: station.dataValues.name }, 'Stuck in virtual station "%s"!', station.dataValues.name)
      train.set('hopId', null)
      train.set('stationId', station.dataValues.id)
      train.set('currentWaitTime', 0)
      train.set('distance', 0)
    }
  } else {
    // Found a valid hop, jumping to it
    logger.info({ gameId, stationName: station.dataValues.name }, 'Hopping to station "%s"', station.dataValues.name)
    train.set('hopId', null)
    train.set('stationId', station.dataValues.id)
    train.set('currentWaitTime', 0)
    train.set('distance', 0)
  }
}

function tickHoppingTrainOvertaking(
  train: Model<any, any>,
  { gameId, lines, trains, hops, stations, agents }:
    { gameId: number, lines: Model<any, any>[], trains: Model<any, any>[], hops: Model<any, any>[], stations: Model<any, any>[], agents: Model<any, any>[] }
) {
  // Deal with one train attempting to overtake another (train in back should wait)
  const newDistance = train.dataValues.distance + train.dataValues.speed
  let trainIsOverTaking = false
  for (let otherTrain of trains) {
    const otherTrainDistance = otherTrain.dataValues.distance
    if (otherTrainDistance > train.dataValues.distance && otherTrainDistance <= newDistance) {
      trainIsOverTaking = true
    }
  }
  if (trainIsOverTaking) {
    // Train would overtake another train. Holding position
    logger.warn({ gameId, trainName: train.dataValues.name }, 'Train "%s" would be overtaking another train. Holding...', train.dataValues.name)
  } else {
    // Train traveling normally
    train.set('distance', newDistance)
  }
}

function tickHoppingTrain(
  train: Model<any, any>,
  { gameId, lines, trains, hops, stations, agents }:
    { gameId: number, lines: Model<any, any>[], trains: Model<any, any>[], hops: Model<any, any>[], stations: Model<any, any>[], agents: Model<any, any>[] }
) {
  logger.info({ gameId, trainName: train.dataValues.name }, 'Handling hopping train "%s"', train.dataValues.name)
  const nextHops = hops
    .filter((hop) => hop.dataValues.id === train.dataValues.hopId)
    .filter((hop) => hop.dataValues.lineId === train.dataValues.lineId)
  const hop = nextHops[Math.floor(Math.random() * nextHops.length)]
  if (hop) {
    const newDistance = train.dataValues.distance + train.dataValues.speed
    if (newDistance >= hop.dataValues.length) {
      tickHoppingTrainTraveling(train, { gameId, lines, trains, hops, stations, agents })
    } else {
      tickHoppingTrainOvertaking(train, { gameId, lines, trains, hops, stations, agents })
    }
  } else {
    logger.warn({ gameId, trainName: train.dataValues.name }, 'Hopping train "%s" has no hops to hop on!', train.dataValues.name)
  }
}

function tickStationedTrain(
  train: Model<any, any>,
  { gameId, lines, trains, hops, stations, agents }:
    { gameId: number, lines: Model<any, any>[], trains: Model<any, any>[], hops: Model<any, any>[], stations: Model<any, any>[], agents: Model<any, any>[] }
) {
  logger.info({ gameId, trainName: train.dataValues.name }, 'Handling stationed train "%s"', train.dataValues.name)
  const stationId: number = train.dataValues.stationId!
  const station: Station = stations.find((station) => station.dataValues.id === stationId)! as Station
  const currentWaitTime = train.dataValues.currentWaitTime
  const maxWaitTime = train.dataValues.maxWaitTime
  const newWaitTime = currentWaitTime + 1
  if (newWaitTime >= maxWaitTime) {
    // Train is departing
    logger.info({ gameId, trainName: train.dataValues.name }, 'Time for train to depart!', train.dataValues.id)
    const nextHops = hops.filter((hop) => hop.dataValues.headId === station.dataValues.id)
    const hop = nextHops.length ? nextHops[Math.floor(Math.random() * nextHops.length)] : null
    if (hop) {
      train.set('hopId', hop.dataValues.id)
      train.set('stationId', null)
      train.set('currentWaitTime', 0)
      train.set('distance', 0)
    }
    else {
      logger.warn({ gameId, trainName: train.dataValues.name }, 'Departing train "%s" has no hops to depart on!', train.dataValues.name)
    }
  }
  else {
    // Train is waiting
    train.set('currentWaitTime', newWaitTime)
  }
}

function tickTravelingAgent(
  agent: Model<any, any>,
  { gameId, lines, trains, hops, stations, agents }:
    { gameId: number, lines: Model<any, any>[], trains: Model<any, any>[], hops: Model<any, any>[], stations: Model<any, any>[], agents: Model<any, any>[] }
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
          logger.warn({ gameId, agentName: agent.dataValues.name, trainName: train.dataValues.name, stationName: station.dataValues.name }, 'Agent "%s" will not be disembarking train "%s" to virtual station "%s"', agent.dataValues.name, train.dataValues.name, station.dataValues.name)
        } else {
          // Agent disembarks train
          logger.info({ gameId, agentName: agent.dataValues.name, trainName: train.dataValues.name, stationName: station.dataValues.name }, 'Agent "%s" is disembarking train "%s" to station "%s"', agent.dataValues.name, train.dataValues.name, station.dataValues.name)
          agent.set('trainId', null)
          agent.set('stationId', station.dataValues.id)
        }
      }
      else {
        // Agent on stationed train is staying put
        logger.info({ gameId, agentName: agent.dataValues.name, stationName: train.dataValues.name }, 'Agent "%s" is staying on stationed train "%s"', agent.dataValues.name, train.dataValues.name)
      }
    }
    else {
      // Agent on traveling train is traveling
      logger.info({ gameId, agentName: agent.dataValues.name, stationName: train.dataValues.name }, 'Agent "%s" is traveling on train "%s"', agent.dataValues.name, train.dataValues.name)
    }
  }
  else {
    logger.error({ gameId, agentName: agent.dataValues.name }, 'Agent "%s" is traveling without a train!', agent.dataValues.name)
  }
}

function tickStationedAgent(
  agent: Model<any, any>,
  { gameId, lines, trains, hops, stations, agents }:
    { gameId: number, lines: Model<any, any>[], trains: Model<any, any>[], hops: Model<any, any>[], stations: Model<any, any>[], agents: Model<any, any>[] }
) {
  logger.info({ gameId, agentName: agent.dataValues.name }, 'Handling stationed agent "%s"', agent.dataValues.name)
  const station = stations.find((station) => station.dataValues.id === agent.dataValues.stationId)
  if (station) {
    const trainsInStation = trains.filter((train) => agent.dataValues.id === train.dataValues.stationId)
    if (trainsInStation.length > 0) {
      const mightBoardTrain = Math.random() < 0.5;
      if (mightBoardTrain) {
        // Stationed agent choosing to board a train
        if (station.dataValues.virtual) {
          // If station is virtual, agent will not board train
          logger.error({ gameId, agentName: agent.dataValues.name, stationName: station.dataValues.name }, 'Agent "%s" trapped in virtual station "%s"', agent.dataValues.name, station.dataValues.name)
        }
        else {
          // Stationed agent in a station with trains, will board a train
          const trainToBoard = trainsInStation[Math.floor(Math.random() * trainsInStation.length)]
          logger.info({ gameId, agentName: agent.dataValues.name, stationName: station.dataValues.name, trainName: trainToBoard.dataValues.name }, 'Agent "%s" at station "%s" boarding train "%s"', agent.dataValues.name, station.dataValues.name, trainToBoard.dataValues.name)
          agent.set('stationId', null)
          agent.set('trainId', trainToBoard.dataValues.id)
        }
      }
      else {
        // Stationed agent in a station with trains, is waiting
        logger.info({ gameId, agentName: agent.dataValues.name, stationName: station.dataValues.name }, 'Agent "%s" is waiting at station "%s" with waiting trains', agent.dataValues.name, station.dataValues.name)
      }
    }
    else {
      // Stationed agent in a station with no trains, is waiting
      logger.info({ gameId, agentName: agent.dataValues.name, stationName: station.dataValues.name }, 'Agent "%s" is waiting at station "%s"', agent.dataValues.name, station.dataValues.name)
    }
  }
  else {
    logger.error({ gameId, agentName: agent.dataValues.name }, 'Agent "%s" is stationed, but the station cannot be found', agent.dataValues.name)
  }
}

async function tickGameTurn(gameId: number) {
  const lines = await db.models.Line.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const trains = await db.models.Train.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const hops = await db.models.Hop.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const stations = await db.models.Station.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const agents = await db.models.Agent.findAll({ where: { gameId: { [Op.eq]: gameId } } })

  logger.info({ gameId }, 'Train phase began')

  // Train phase
  for (let train of trains) {
    logger.info({ gameId, trainName: train.dataValues.name }, 'Handling train "%s"', train.dataValues.name)
    // Hopping train
    if (train.dataValues.hopId) {
      tickHoppingTrain(train, { gameId, lines, trains, hops, stations, agents })
      await train.save()
    }
    // Stationed train
    else if (train.dataValues.stationId) {
      tickStationedTrain(train, { gameId, lines, trains, hops, stations, agents })
      await train.save()
    }
    // A train is "out-of-bounds" if not hopping or stationed.
    else {
      logger.error({ gameId, trainName: train.dataValues.name }, 'Train "%s" is out-of-bounds. Skipping!', train.dataValues.name)
    }
  }

  // Agent phase
  for (let agent of agents) {
    logger.info({ gameId, agentName: agent.dataValues.name }, 'Handling agent "%s"', agent.dataValues.name)
    // Traveling agent
    if (agent.dataValues.trainId) {
      tickTravelingAgent(agent, { gameId, lines, trains, hops, stations, agents })
      await agent.save()
    }
    // Stationed agent
    else if (agent.dataValues.stationId) {
      tickStationedAgent(agent, { gameId, lines, trains, hops, stations, agents })
      await agent.save()
    }
    // An agent is "out-of-bounds" if not traveling or stationed.
    else {
      logger.error({ gameId, agentName: agent.dataValues.name }, 'Agent "%s" is out-of-bounds. Skipping!', agent.dataValues.name)
    }
  }
}

async function tickGame(game: Model<any, any>) {
  const gameName = game.dataValues.name
  const gameId = game.dataValues.id
  try {
    await db.transaction(async (t) => {
      logger.info({ gameId }, 'Began processing tick for game...')
      await tickGameTurn(gameId)
      logger.info({ gameId }, 'Finished processing tick for game!')
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
      await db.models.GameTurn.create({ gameId, data: newGame })
      logger.info({ gameId }, 'Finished caching game turn data!')
    });
    logger.info({ gameId }, 'Transaction committed for game!')
  } catch (error) {
    logger.error({ gameId, error }, 'Transaction rolled back due to error!')
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