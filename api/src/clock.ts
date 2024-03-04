import dotenv from 'dotenv';
import db, { Hop, Station } from './models';
import { Model, Op, Sequelize } from 'sequelize';
import { logger } from './logging'

dotenv.config();

const runOnce: boolean = Boolean( process.env.RUN_ONCE && process.env.RUN_ONCE.toLowerCase() !== 'false' )
const tickInterval: number = parseInt(process.env.TICK_INTERVAL || '5000', 10)

function tickHoppingTrain(
  train: Model<any, any>,
  { gameId, lines, trains, hops, stations, agents }:
    { gameId: number, lines: Model<any, any>[], trains: Model<any, any>[], hops: Model<any, any>[], stations: Model<any, any>[], agents: Model<any, any>[] }
) {
  logger.info({ gameId, trainName: train.dataValues.name }, 'Handling hopping train "%s"', train.dataValues.name)
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
          logger.warn({ gameId, stationName: station.dataValues.name }, 'There is another train in station "%s". Holding...', station.dataValues.name)
        }
        else {
          // Found a station to transfer to. Will transfer
          logger.info({ gameId, stationName: station.dataValues.name }, 'Hopping to station "%s"', station.dataValues.name)
          train.set('hopId', null)
          train.set('stationId', station.dataValues.id)
          train.set('currentWaitTime', 0)
          train.set('distance', 0)
        }
      }
      else {
        // Could not find station to transfer to. Hold position.
        logger.warn({ gameId, trainName: train.dataValues.name }, 'Train "%s" could not find a station to transfer to. Holding...', train.dataValues.name)
      }
    }
    else {
      // Traveling normally
      const overtakenTrains = trains
        // Filter out current train
        .filter((otherTrain) => otherTrain.dataValues.id !== train.dataValues.id)
        // Only consider trains of the same line
        .filter((otherTrain) => otherTrain.dataValues.lineId !== train.dataValues.lineId)
        // Filter down to trains in the same hop
        .filter((otherTrain) => otherTrain.dataValues.hopId === train.dataValues.hopId)
        // Filter down to trains ahead of current train 
        .filter((otherTrain) => train.dataValues.distance < otherTrain.dataValues.distance)
        // Filter down to trains which *would be behind* of current train, if it moves
        .filter((otherTrain) => train.dataValues.distance + train.dataValues.speed >= otherTrain.dataValues.distance)
      if (overtakenTrains.length) {
        // Train would overtake another train. Holding position
        logger.warn({ gameId, trainName: train.dataValues.name }, 'Train "%s" would be overtaking another train. Holding...', train.dataValues.name)
      }
      else {
        // Train traveling normally
        train.set('distance', train.dataValues.distance + train.dataValues.speed)
        logger.info({ gameId, trainName: train.dataValues.name }, 'Train "%s" traveling normally...', train.dataValues.name)
      }
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
  const station = stations.find((station) => station.dataValues.id === train.dataValues.stationId)
  if (station) {
    if (station.dataValues.virtual) {
      // Trains depart virtual stations immediately
      logger.info({ gameId, trainName: train.dataValues.name }, 'Time for train to depart virtual station!', train.dataValues.id)
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
      }
      else {
        logger.warn({ gameId, trainName: train.dataValues.name }, 'Departing train "%s" has no hops to depart on!', train.dataValues.name)
      }
    }
    else {
      if (train.dataValues.currentWaitTime >= train.dataValues.maxWaitTime) {
        // Train is departing
        logger.info({ gameId, trainName: train.dataValues.name }, 'Time for train to depart!', train.dataValues.id)
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
        }
        else {
          logger.warn({ gameId, trainName: train.dataValues.name }, 'Departing train "%s" has no hops to depart on!', train.dataValues.name)
        }
      }
      else {
        // Train is waiting
        train.set('currentWaitTime', train.dataValues.currentWaitTime + 1)
        logger.info({ gameId, trainName: train.dataValues.name }, 'Train "%s" is waiting in station', train.dataValues.name)
      }
    }
  }
  else {
    logger.error({ gameId, trainName: train.dataValues.name }, 'Stationed train has no station!', train.dataValues.name)
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
    const trainsInStation = trains.filter((train) => station.dataValues.id === train.dataValues.stationId)
    if (trainsInStation.length > 0) {
      const mightBoardTrain = Math.random() < 0.5; // TODO: Change this
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
      const previousGameTurn = await db.models.GameTurn.findOne({
        order: [['turnNumber', 'DESC']],
        where: { gameId }
      })
      const previousTurnNumber = previousGameTurn?.dataValues.turnNumber || 0
      const turnNumber = previousTurnNumber + 1
      await db.models.GameTurn.create({
        gameId,
        turnNumber,
        data: newGame
      })
      logger.info({ gameId, turnNumber }, 'Finished caching game turn data!')
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