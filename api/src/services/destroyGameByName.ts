import { Sequelize } from "sequelize"

const destroyGameByName = (db: Sequelize) => async (name: string) => {
  const game = (await db.models.Game.findOne({ where: { name } }))!
  if (!game) {
    return
  }

  await db.models.Message.destroy({ where: { gameId: game.dataValues.id } })
  await db.models.Hazard.destroy({ where: { gameId: game.dataValues.id } })
  await db.models.Item.destroy({ where: { gameId: game.dataValues.id } })
  await db.models.Agent.destroy({ where: { gameId: game.dataValues.id } })
  await db.models.Hazard.destroy({ where: { gameId: game.dataValues.id } })
  await db.models.Train.destroy({ where: { gameId: game.dataValues.id } })
  await db.models.Hop.destroy({ where: { gameId: game.dataValues.id } })
  await db.models.Line.destroy({ where: { gameId: game.dataValues.id } })
  await db.models.Station.destroy({ where: { gameId: game.dataValues.id } })
  await db.models.GameTurn.destroy({ where: { gameId: game.dataValues.id } })

  await game.destroy()
}

export default destroyGameByName