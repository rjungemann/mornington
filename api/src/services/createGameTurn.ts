import { Sequelize } from "sequelize"
import { logger } from "../logging"

const createGameTurn = (db: Sequelize) => async (gameName: string) => {
  logger.info({ gameName }, 'createGameTurn')

  // Pull up the updated game data
  const game = await db.models.Game.findOne({
    include: [
      { model: db.models.Station, as: 'stations' },
      { model: db.models.Line, as: 'lines' },
      { model: db.models.Hop, as: 'hops' },
      { model: db.models.Train, as: 'trains' },
      { model: db.models.Agent, as: 'agents' },
      { model: db.models.Hazard, as: 'hazards' },
      { model: db.models.Item, as: 'items' },
    ],
    where: { name: gameName }
  })
  if (!game) {
    logger.error('Could not find existing game by name')
    return
  }

  // Store pre-digested game turn data
  await db.models.GameTurn.create({
    gameId: game.dataValues.id,
    turnNumber: game.dataValues.turnNumber,
    currentTime: game.dataValues.currentTime,
    data: game
  })
}

export default createGameTurn