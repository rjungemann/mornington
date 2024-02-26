import dotenv from 'dotenv';
import db, { Hop, Station } from './models';
import { Model, Op } from 'sequelize';
import { findCompleteGameByName, listHopsByGameIdAndStationId } from './services';
import { logger } from './logging'

dotenv.config();

const runOnce: boolean = Boolean( process.env.RUN_ONCE && process.env.RUN_ONCE.toLowerCase() !== 'false' )
const tickInterval: number = parseInt(process.env.TICK_INTERVAL || '10000', 10)

// TODO: There should be a destination

async function tickHoppingTrain(
  train: Model<any, any>,
  { gameId, trains, hops, stations, agents }:
    { gameId: number, trains: Model<any, any>[], hops: Model<any, any>[], stations: Model<any, any>[], agents: Model<any, any>[] }
) {
  logger.info({ gameId, trainName: train.dataValues.name }, 'Handling hopping train "%s"', train.dataValues.name)
  const hopId: number = train.dataValues.hopId!
  const hop: Hop = hops.find((hop) => hop.dataValues.id === hopId)! as Hop
  const length = hop.dataValues.length
  const distance = train.dataValues.distance
  const speed = train.dataValues.speed
  const newDistance = distance + speed
  if (newDistance >= length) {
    // Train hopping to station
    const newStationId = hop.dataValues.tailId
    const station: Station = stations.find((station) => station.dataValues.id === newStationId)! as Station
    logger.info({ gameId, stationName: station.dataValues.name }, 'Hopping to station "%s"', station.dataValues.name)
    train.set('hopId', null)
    train.set('stationId', newStationId)
    train.set('currentWaitTime', 0)
    train.set('distance', 0)
  } else {
    let trainIsOverTaking = false
    for (let otherTrain of trains) {
      const otherTrainDistance = otherTrain.dataValues.distance
      if (otherTrainDistance > distance && otherTrainDistance <= newDistance) {
        trainIsOverTaking = true
      }
    }
    if (trainIsOverTaking) {
      // Train would overtake another train. Holding position
      logger.info({ gameId, trainName: train.dataValues.name }, 'Train "%s" would be overtaking another train. Holding...', train.dataValues.name)
    } else {
      // Train traveling normally
      train.set('distance', newDistance)
    }
  }
  await train.save()
}

async function tickStationedTrain(
  train: Model<any, any>,
  { gameId, trains, hops, stations, agents }:
    { gameId: number, trains: Model<any, any>[], hops: Model<any, any>[], stations: Model<any, any>[], agents: Model<any, any>[] }
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
    const hops = await listHopsByGameIdAndStationId(db)(gameId, station.dataValues.id)
    const hop = hops.length ? hops[Math.floor(Math.random() * hops.length)] : null
    if (hop) {
      train.set('hopId', hop.dataValues.id)
      train.set('stationId', null)
      train.set('currentWaitTime', 0)
      train.set('distance', 0)
    }
    else {
      throw new Error('Could not find a hop to connect to')
    }
  }
  else {
    // Train is waiting
    train.set('currentWaitTime', newWaitTime)
  }
  await train.save()
}

async function tickTravelingAgent(
  agent: Model<any, any>,
  { gameId, trains, hops, stations, agents }:
    { gameId: number, trains: Model<any, any>[], hops: Model<any, any>[], stations: Model<any, any>[], agents: Model<any, any>[] }
) {
  const train = trains.find((train) => train.dataValues.id === agent.dataValues.id)!
  const station = stations.find((station) => station.dataValues.id === train.dataValues.stationId)!
  if (train.dataValues.stationId) {
    const mightDisembarkTrain = Math.random() < 0.5;
    if (mightDisembarkTrain) {
      // Agent on stationed train is disembarking at station
      logger.info({ gameId, agentName: agent.dataValues.name, trainName: train.dataValues.name, stationName: station.dataValues.name }, 'Agent "%s" is disembarking train "%s" to station "%s"', agent.dataValues.name, train.dataValues.name, station.dataValues.name)
      agent.set('trainId', null)
      agent.set('stationId', station.dataValues.id)
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
  agent.save()
}

async function tickStationedAgent(
  agent: Model<any, any>,
  { gameId, trains, hops, stations, agents }:
    { gameId: number, trains: Model<any, any>[], hops: Model<any, any>[], stations: Model<any, any>[], agents: Model<any, any>[] }
) {
  logger.info({ gameId, agentName: agent.dataValues.name }, 'Handling stationed agent "%s"', agent.dataValues.name)
  const station = stations.find((station) => station.dataValues.id === agent.dataValues.id)!
  const trainsInStation = trains.filter((train) => agent.dataValues.id === train.dataValues.stationId)
  if (trainsInStation.length > 0) {
    const mightBoardTrain = Math.random() < 0.5;
    if (mightBoardTrain) {
      // Stationed agent in a station with trains, will board a train
      const trainToBoard = trainsInStation[Math.floor(Math.random() * trainsInStation.length)]
      logger.info({ gameId, agentName: agent.dataValues.name, stationName: station.dataValues.name, trainName: trainToBoard.dataValues.name }, 'Agent "%s" at station "%s" boarding train "%s"', agent.dataValues.name, station.dataValues.name, trainToBoard.dataValues.name)
      agent.set('stationId', null)
      agent.set('trainId', trainToBoard.dataValues.id)
    } else {
      // Stationed agent in a station with trains, is waiting
      logger.info({ gameId, agentName: agent.dataValues.name, stationName: station.dataValues.name }, 'Agent "%s" is waiting at station "%s" with waiting trains', agent.dataValues.name, station.dataValues.name)
    }
  } else {
    // Stationed agent in a station with no trains, is waiting
    logger.info({ gameId, agentName: agent.dataValues.name, stationName: station.dataValues.name }, 'Agent "%s" is waiting at station "%s"', agent.dataValues.name, station.dataValues.name)
  }
  await agent.save()
}

async function tickGame(gameId: number) {
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
      await tickHoppingTrain(train, { gameId, trains, hops, stations, agents })
    }
    // Stationed train
    else if (train.dataValues.stationId) {
      await tickStationedTrain(train, { gameId, trains, hops, stations, agents })
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
      await tickTravelingAgent(agent, { gameId, trains, hops, stations, agents })
    }
    // Stationed agent
    else if (agent.dataValues.stationId) {
      await tickStationedAgent(agent, { gameId, trains, hops, stations, agents })
    }
    // An agent is "out-of-bounds" if not traveling or stationed.
    else {
      logger.error({ gameId, agentName: agent.dataValues.name }, 'Agent "%s" is out-of-bounds. Skipping!', agent.dataValues.name)
    }
  }
}

async function tick() {
  logger.info('Ticker starting...')

  // Initialize DB
  await db.sync({ force: false });

  logger.info('Ticker started!...')
  const games = await db.models.Game.findAll({ attributes: ['id', 'name'] })
  // TODO: Use `await Promise.allSettled([...])` so games can be concurrently processed
  for (let game of games) {
    const gameName = game.dataValues.name
    const gameId = game.dataValues.id
    try {
      await db.transaction(async (t) => {
        logger.info({ gameId }, 'Began processing tick for game...')
        await tickGame(gameId)
        logger.info({ gameId }, 'Finished processing tick for game!')

        const newGame = await findCompleteGameByName(db)(gameName)
        await db.models.GameTurn.create({ gameId, data: newGame })
        logger.info({ gameId }, 'Finished caching game turn data!')
      });
      logger.info({ gameId }, 'Transaction committed for game!')
    } catch (error) {
      logger.error({ gameId, error }, 'Transaction rolled back due to error!')
    }
  }
  logger.info('Ticker finished!')
}

const timeout = (interval: number) => new Promise((res) => setTimeout(res, interval))

async function main() {
  while (true) {
    await tick()
    logger.info('Ticker will tick again in %sms!', tickInterval)
    await timeout(tickInterval)
    if (runOnce) {
      break;
    }
  }
}

main()