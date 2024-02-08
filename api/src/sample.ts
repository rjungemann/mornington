import db from './models'
import { logger } from './logging'

async function main() {
  await db.sync({ force: false })

  // Query for station with included data
  const s = await db.models.Station.findOne({
    include: [
      { model: db.models.Hop, as: 'headHops' },
      { model: db.models.Hop, as: 'tailHops' },
      { model: db.models.Train, as: 'trains' },
      { model: db.models.Agent, as: 'agents' }
    ]
  })
  // logger.info(s?.dataValues, 'station with included data')
  // Query for hop with included data
  const h = await db.models.Hop.findOne({
    include: [
      { model: db.models.Station, as: 'head' },
      { model: db.models.Station, as: 'tail' },
      { model: db.models.Train, as: 'trains' }
    ]
  })
  // logger.info(h?.dataValues, 'hop with included data')
  // Query for train with included data
  const t = await db.models.Train.findOne({
    include: [
      { model: db.models.Agent, as: 'agents' },
      { model: db.models.Station, as: 'station' },
      { model: db.models.Hop, as: 'hop' }
    ]
  })
  // logger.info(h?.dataValues, 'train with included data')
  // Query for agent with included data
  const a = await db.models.Agent.findOne({
    include: [
      { model: db.models.Station, as: 'station' },
      { model: db.models.Train, as: 'train' },
    ]
  })
  // logger.info(a?.dataValues, 'agent with included data')

  // Query for game with included data
  const g = await db.models.Game.findOne({
    include: [
      { model: db.models.Station, as: 'stations' },
      { model: db.models.Hop, as: 'hops' },
      { model: db.models.Train, as: 'trains' },
      { model: db.models.Agent, as: 'agents' },
    ]
  })
  // logger.info(g?.dataValues, 'game with included data')
  logger.info(g?.dataValues.stations[0], 'game with included data')

  process.exit()
}

main()