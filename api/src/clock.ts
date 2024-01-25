import dotenv from 'dotenv';
import db, { Game, Train } from './models';
import { Attributes, CreationAttributes, InferAttributes, InferCreationAttributes, Model, ModelStatic, Op, Sequelize } from 'sequelize';
import { listHoppingTrainsByGameId, listHopsByGameIdAndStationId, listStationTrainsByGameId } from './services';

dotenv.config();

async function main() {
  // Initialize DB
  await db.sync({ force: false });

  // TODO: Batch this
  const games = await db.models.Game.findAll()
  for (let game of games) {
    const gameId = game.dataValues.id
    console.log('Processing game with ID', gameId)
  
    const hoppingTrains = await listHoppingTrainsByGameId(db)(gameId)
    for (let train of hoppingTrains) {
      const hop = train.dataValues.hop!
      // console.log('Hopping train', hop)
      const length = hop.dataValues.length
      const distance = train.dataValues.distance
      const speed = train.dataValues.speed
      const newDistance = distance + speed
      if (newDistance >= length) {
        const newStationId = hop.dataValues.tailId
        console.log('Hopping to station ID', newStationId)
        train.set('hopId', null)
        train.set('stationId', newStationId)
        train.set('currentWaitTime', 0)
        train.set('distance', 0)
      } else {
        train.set('distance', newDistance)
      }
      await train.save()
    }
  
    const stationTrains = await listStationTrainsByGameId(db)(gameId)
    for (let train of stationTrains) {
      const station = train.dataValues.station!
      // console.log('Station train', station)
      const currentWaitTime = train.dataValues.currentWaitTime
      const maxWaitTime = train.dataValues.maxWaitTime
      const newWaitTime = currentWaitTime + 1
      if (newWaitTime >= maxWaitTime) {
        console.log('Time for train to depart!', train.dataValues.id)
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
  }
  
  console.info('Ticker started!')
  process.exit()
}

main()