import dotenv from 'dotenv';
import db, { Train } from './models'
import { Attributes, CreationAttributes, InferAttributes, InferCreationAttributes, Model, Op, Sequelize } from 'sequelize';

dotenv.config();

const listHoppingTrains = (db: Sequelize) => {
  return () => db.models.Train.findAll({
    include: [{ model: db.models.Hop, as: 'hop' }],
    where: { hopId: { [Op.ne]: null } }
  })
}

const listStationTrains = (db: Sequelize) => {
  return () => db.models.Train.findAll({
    include: [{ model: db.models.Station, as: 'station' }],
    where: { stationId: { [Op.ne]: null } }
  })
}

async function main() {
  await db.sync({ force: false });
  
  console.log(await listHoppingTrains(db)())
  console.log(await listStationTrains(db)())
  
  console.info('Ticker started!')
  process.exit()
}

main()