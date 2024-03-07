import { Sequelize } from "sequelize"

const destroyGameByName = (db: Sequelize) => async (name: string) => {
  await db.transaction(async (t) => {
    const game = (await db.models.Game.findOne({ where: { name } }))!

    await db.models.Message.destroy({ where: { gameId: game.dataValues.id } })
    await db.models.Agent.destroy({ where: { gameId: game.dataValues.id } })
    await db.models.Train.destroy({ where: { gameId: game.dataValues.id } })
    await db.models.Hop.destroy({ where: { gameId: game.dataValues.id } })
    await db.models.Line.destroy({ where: { gameId: game.dataValues.id } })
    await db.models.Station.destroy({ where: { gameId: game.dataValues.id } })
    await db.models.GameTurn.destroy({ where: { gameId: game.dataValues.id } })

    await game.destroy()
  })
}

export default destroyGameByName