import db from '../../models';
import { logger } from '../../logging'
import { ClockContext } from '../../types';
import { gameSeededRandom } from '../ticks/shared';

async function tickHazards(context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards } = context
  const { id: gameId, name: gameName, turnNumber } = game.dataValues
  if (gameSeededRandom(game) < 0.05) {
    const hop = hops[Math.floor(gameSeededRandom(game) * hops.length)]
    const distance = Math.floor(gameSeededRandom(game) * hop.dataValues.length)
    const hazard = await db.models.Hazard.create({
      name: 'mystery-slime:1',
      title: 'Mystery Slime',
      label: 'Some sort of mystery slime',
      color: '#d76cffff',
      kind: 'stop',
      age: 0,
      distance,
      hopId: hop.dataValues.id,
      gameId
    })
    logger.warn(
      {
        gameName,
        turnNumber,
        hazardName: hazard.dataValues.name
      },
      'A hazard appeared!'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `A new hazard ${hazard.dataValues.name} appeared!`
    })
  }
  if (gameSeededRandom(game) < 0.05) {
    const hazard = hazards[Math.floor(gameSeededRandom(game) * hazards.length)]
    if (hazard) {
      logger.warn(
        {
          gameName,
          turnNumber,
          hazardName: hazard.dataValues.name
        },
        'A hazard was went away!'
      )
      await db.models.Message.create({
        gameId,
        turnNumber,
        message: `The hazard ${hazard.dataValues.name} went away!`
      })
      await hazard.destroy()
    }
  }
}

export { tickHazards }