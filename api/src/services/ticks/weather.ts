import { rollDice } from "../../diceparser"
import { logger } from "../../logging"
import { ClockContext } from "../../types"
import { gameSeededRandom } from "./shared"
import db from "../../models"

async function createLightningStrike(context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards } = context
  const { id: gameId, name: gameName, turnNumber, currentTime } = game.dataValues

  const otherAgents = agents
  .filter((a) => a.dataValues.timeout === 0)
  const otherAgent = otherAgents[Math.floor(gameSeededRandom(game) * otherAgents.length)]
  if (!otherAgent) {
    return
  }

  const { sum, dice } = rollDice('d6', { randomFn: () => gameSeededRandom(game) })
  otherAgent.set('currentHp', otherAgent.dataValues.currentHp - sum)

  if (otherAgent.dataValues.currentHp <= 0) {
    const startingStations = stations.filter((s) => s.dataValues.start)
    const startingStation = startingStations[Math.floor(gameSeededRandom(game) * startingStations.length)]
    if (!startingStation) {
      logger.error(
        {
          gameName,
          turnNumber,
          otherAgentName: otherAgent.dataValues.name,
          damage: sum,
          dice
        },
        'Agent was felled by lightning, and they could not be reincarnated!'
      )
      await db.models.Message.create({
        gameId,
        turnNumber,
        currentTime,
        message: `Agent ${otherAgent.dataValues.title} was felled by lightning, and they could not be reincarnated!`
      })
      return
    }

    logger.warn(
      {
        gameName,
        turnNumber,
        otherAgentName: otherAgent.dataValues.name,
        damage: sum,
        dice
      },
      'Agent was felled by lightning, and they are being reincarnated!'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      currentTime,
      message: `Agent ${otherAgent.dataValues.title} was felled by lightning, and they are being reincarnated at ${startingStation.dataValues.title}!`
    })

    otherAgent.set('currentHp', otherAgent.dataValues.maxHp)
    // TODO: Make this dynamic
    otherAgent.set('timeout', 5)
    otherAgent.set('stationId', startingStation.dataValues.id)
    otherAgent.set('trainId', null)
    await otherAgent.save()
    return
  }

  logger.warn(
    {
      gameName,
      turnNumber,
      otherAgentName: otherAgent.dataValues.name,
      damage: sum,
      dice
    },
    'Agent was struck by lightning!'
  )
  await db.models.Message.create({
    gameId,
    turnNumber,
    currentTime,
    message: `Agent ${otherAgent.dataValues.title} was struck by lightning!`
  })
  otherAgent.set('currentHp', otherAgent.dataValues.currentHp - sum)
  await otherAgent.save()
}

async function tickWeather(context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards } = context
  const { id: gameId, name: gameName, turnNumber, currentTime } = game.dataValues

  // Chance to strike an agent with lightning if it is raining
  if (game.dataValues.weatherName === 'rainy') {
    if (gameSeededRandom(game) < 0.05) {
      await createLightningStrike(context)
    }
  }
  // Change the weather
  if (game.dataValues.weatherName === 'rainy') {
    if (gameSeededRandom(game) < 0.05) {
      game.set('weatherName', 'cloudy')
      game.set('weatherTitle', 'Cloudy')
      game.set('weatherLabel', 'Cloudy')
      logger.warn(
        {
          gameName,
          turnNumber,
        },
        'Weather changed from rainy to cloudy.'
      )
      await db.models.Message.create({
        gameId,
        turnNumber,
        currentTime,
        message: `Weather changed from rainy to cloudy.`
      })
    }
  }
  if (game.dataValues.weatherName === 'cloudy') {
    if (gameSeededRandom(game) < 0.05) {
      game.set('weatherName', 'rainy')
      game.set('weatherTitle', 'Rainy')
      game.set('weatherLabel', 'Rainy')
      logger.warn(
        {
          gameName,
          turnNumber,
        },
        'Weather changed from cloudy to rainy.'
      )
      await db.models.Message.create({
        gameId,
        turnNumber,
        currentTime,
        message: `Weather changed from cloudy to rainy.`
      })
    }
  }
  if (game.dataValues.weatherName === 'cloudy') {
    if (gameSeededRandom(game) < 0.05) {
      game.set('weatherName', 'partly-cloudy')
      game.set('weatherTitle', 'Partly Cloudy')
      game.set('weatherLabel', 'Partly Cloudy')
      logger.warn(
        {
          gameName,
          turnNumber,
        },
        'Weather changed from cloudy to partly cloudy.'
      )
      await db.models.Message.create({
        gameId,
        turnNumber,
        currentTime,
        message: `Weather changed from cloudy to partly cloudy.`
      })
    }
  }
  if (game.dataValues.weatherName === 'partly-cloudy') {
    if (gameSeededRandom(game) < 0.05) {
      game.set('weatherName', 'cloudy')
      game.set('weatherTitle', 'Cloudy')
      game.set('weatherLabel', 'Cloudy')
      logger.warn(
        {
          gameName,
          turnNumber,
        },
        'Weather changed from partly cloudy to cloudy.'
      )
      await db.models.Message.create({
        gameId,
        turnNumber,
        currentTime,
        message: `Weather changed from partly cloudy to cloudy.`
      })
    }
  }
}

export { tickWeather }