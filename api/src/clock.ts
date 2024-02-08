import dotenv from 'dotenv';
import db, { Game, Hop, Station, Train } from './models';
import { Attributes, CreationAttributes, InferAttributes, InferCreationAttributes, Model, ModelStatic, Op, Sequelize } from 'sequelize';
import { listHoppingTrainsByGameId, listHopsByGameIdAndStationId, listStationTrainsByGameId } from './services';
import { logger } from './logging'

dotenv.config();

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
      logger.info({ gameId, trainName: train.dataValues.name }, 'Handling hopping train "%s"', train.dataValues.name)
      const hopId: number = train.dataValues.hopId!
      const hop: Hop = hops.find((hop) => hop.dataValues.id === hopId)! as Hop
      const length = hop.dataValues.length
      const distance = train.dataValues.distance
      const speed = train.dataValues.speed
      const newDistance = distance + speed
      if (newDistance >= length) {
        const newStationId = hop.dataValues.tailId
        const station: Station = stations.find((station) => station.dataValues.id === newStationId)! as Station
        logger.info({ gameId, stationName: station.dataValues.name }, 'Hopping to station "%s"', station.dataValues.name)
        train.set('hopId', null)
        train.set('stationId', newStationId)
        train.set('currentWaitTime', 0)
        train.set('distance', 0)
      } else {
        train.set('distance', newDistance)
      }
      await train.save()
    }
    // Stationed train
    else if (train.dataValues.stationId) {
      logger.info({ gameId, trainName: train.dataValues.name }, 'Handling station train "%s"', train.dataValues.name)
      const stationId: number = train.dataValues.stationId!
      const station: Station = stations.find((station) => station.dataValues.id === stationId)! as Station
      const currentWaitTime = train.dataValues.currentWaitTime
      const maxWaitTime = train.dataValues.maxWaitTime
      const newWaitTime = currentWaitTime + 1
      if (newWaitTime >= maxWaitTime) {
        logger.info({ gameId, trainName: train.dataValues.name }, 'Time for train to depart!', train.dataValues.id)
        const hops = await listHopsByGameIdAndStationId(db)(gameId, station.dataValues.id)
        const hop = hops.length ? hops[Math.floor(Math.random() * hops.length)] : null
        if (hop) {
          train.set('hopId', hop.dataValues.id)
          train.set('stationId', null)
          train.set('currentWaitTime', 0)
          train.set('distance', 0)
        } else {
          throw new Error('Could not find a hop to connect to')
        }
      } else {
        train.set('currentWaitTime', newWaitTime)
      }
      await train.save()
    }
    else {
      logger.error({ gameId, trainName: train.dataValues.name }, 'Train "%s" in invalid state, skipping!', train.dataValues.name)
    }
  }
}

async function main() {
  logger.info('Ticker starting...')

  // Initialize DB
  await db.sync({ force: false });

  logger.info('Ticker started!...')

  // TODO: Batch this
  const games = await db.models.Game.findAll()
  for (let game of games) {
    const gameName = game.dataValues.name
    const gameId = game.dataValues.id
    try {
      await db.transaction(async (t) => {
        logger.info({ gameName, gameId }, `Began processing tick for game "${gameName}"...`)
        await tickGame(gameId)
        logger.info({ gameName, gameId }, `Finished processing tick for game "${gameName}"!`)
      });
    
      logger.info({ gameName, gameId }, `Transaction committed for game "${gameName}"!`)
    } catch (error) {
      logger.error({ gameName, gameId, error }, `Transaction rolled back due to error for game "${gameName}"!`, gameName)
    }
  }

  logger.info('Ticker finished!')
  process.exit()
}

main()