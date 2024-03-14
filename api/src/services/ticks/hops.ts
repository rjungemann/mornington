import { rollDice } from "../../diceparser"
import { logger } from "../../logging"
import { ClockContext } from "../../types"
import { gameSeededRandom } from "./shared"
import db from "../../models"

async function tickHops(context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards } = context
  const { id: gameId, name: gameName, turnNumber, currentTime } = game.dataValues

  // Chance to toggle track switches
  if (gameSeededRandom(game) < 0.15) {
    const selectedHops = hops.filter((h) => h.dataValues.switchGroups.find((sg) => sg === 'a' || sg === 'b'))
    for (let hop of selectedHops) {
      hop.set('active', !hop.dataValues.active)
      const result = await hop.save()

      logger.warn(
        {
          gameName,
          turnNumber,
          hopName: hop.dataValues.name,
        },
        `The hop ${hop.dataValues.label} flipped to ${hop.dataValues.active ? 'active' : 'inactive'}!`
      )
      await db.models.Message.create({
        gameId,
        turnNumber,
        currentTime,
        message: `The hop ${hop.dataValues.label} flipped to ${hop.dataValues.active ? 'active' : 'inactive'}!`
      })
    }
  }
}

export { tickHops }