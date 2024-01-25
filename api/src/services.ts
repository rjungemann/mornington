import { Op, Sequelize } from "sequelize";

export const findCompleteGameByName = (db: Sequelize) => (name: string) => (
  db.models.Game.findOne({
    include: [
      { model: db.models.Station, as: 'stations' },
      { model: db.models.Hop, as: 'hops' },
      { model: db.models.Train, as: 'trains' },
      { model: db.models.Agent, as: 'agents' },
    ],
    where: { name }
  })
)

export const listHoppingTrainsByGameId = (db: Sequelize) => (gameId: number) => (
  db.models.Train.findAll({
    include: [{ model: db.models.Hop, as: 'hop' }],
    where: { gameId: { [Op.eq]: gameId }, hopId: { [Op.ne]: null } }
  })
)

export const listStationTrainsByGameId = (db: Sequelize) => (gameId: number) => (
  db.models.Train.findAll({
    include: [{ model: db.models.Station, as: 'station' }],
    where: { gameId: { [Op.eq]: gameId }, stationId: { [Op.ne]: null } }
  })
)

export const listHopsByGameIdAndStationId = (db: Sequelize) => (gameId: number, stationId: number) => (
  db.models.Hop.findAll({
    where: { gameId: { [Op.eq]: gameId }, headId: { [Op.eq]: stationId } }
  })
)