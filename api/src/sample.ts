import db from './models'

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
  console.log(s?.dataValues)
  // Query for hop with included data
  const h = await db.models.Hop.findOne({
    include: [
      { model: db.models.Station, as: 'head' },
      { model: db.models.Station, as: 'tail' },
      { model: db.models.Train, as: 'trains' }
    ]
  })
  console.log(h?.dataValues)
  // Query for train with included data
  const t = await db.models.Train.findOne({
    include: [
      { model: db.models.Agent, as: 'agents' },
      { model: db.models.Station, as: 'station' },
      { model: db.models.Hop, as: 'hop' }
    ]
  })
  console.log(h?.dataValues)
  // Query for agent with included data
  const a = await db.models.Agent.findOne({
    include: [
      { model: db.models.Station, as: 'station' },
      { model: db.models.Train, as: 'train' },
    ]
  })
  console.log(a?.dataValues)

  const g = await db.models.Game.findOne({
    include: [
      { model: db.models.Station, as: 'stations' },
      { model: db.models.Hop, as: 'hops' },
      { model: db.models.Train, as: 'trains' },
      { model: db.models.Agent, as: 'agents' },
    ]
  })
  console.log(g?.dataValues)

  process.exit()
}

main()