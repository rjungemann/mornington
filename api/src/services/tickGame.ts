import db, { Game } from '../models';
import { Model, Op, Sequelize } from 'sequelize';
import { logger } from '../logging'
import createGameTurn from '../services/createGameTurn';
import { tickTrains } from './ticks/trains';
import { tickAgents } from './ticks/agents';
import { tickHazards } from './ticks/hazards';
import { tickWeather } from './ticks/weather';

async function tickGameTurn(game: Model<Game>) {
  const gameId = game.dataValues.id
  const lines = await db.models.Line.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const trains = await db.models.Train.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const hops = await db.models.Hop.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const stations = await db.models.Station.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const agents = await db.models.Agent.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const hazards = await db.models.Hazard.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const items = await db.models.Item.findAll({ where: { gameId: { [Op.eq]: gameId } } })

  const context = { db, game, lines, trains, hops, stations, agents, hazards, items }

  // Weather phase
  await tickWeather(context)

  // Hazard phase
  await tickHazards(context)

  // Train phase
  await tickTrains(context)

  // Agent phase
  await tickAgents(context)

  // Update age of hazards
  for (let hazard of hazards) {
    hazard.set('age', hazard.dataValues.age + 1)
    await hazard.save()
  }

  // Halt game if it is finished
  const destinations = stations.filter((station) => station.dataValues.end)
  const finishedAgents = agents.filter((agent) => destinations.find((s) => agent.dataValues.stationId === s.dataValues.id))
  if (finishedAgents.length > 0) {
    game.set('finished', true)
  }

  await game.save()
}

const tickGame = (db: Sequelize) => async (game: Model<Game>) => {
  const gameName = game.dataValues.name
  const gameId = game.dataValues.id
  try {
    await db.transaction(async (t) => {
      // Calculate current turn number
      const previousTurnNumber = game.dataValues.turnNumber
      const turnNumber = previousTurnNumber + 1
      game.set('turnNumber', turnNumber)

      // Calculate current time
      const turnDurationSeconds = game.dataValues.turnDurationSeconds
      const previousCurrentTime = game.dataValues.currentTime
      const currentTime = new Date(previousCurrentTime.getTime() + turnDurationSeconds)
      game.set('currentTime', currentTime)

      // Tick the game
      logger.info({ gameName, turnNumber }, 'Began processing tick for game...')
      await tickGameTurn(game)
      logger.info({ gameName, turnNumber }, 'Finished processing tick for game!')
      // Pull up the updated game data
      await createGameTurn(db)(gameName)
      logger.info({ gameName, turnNumber }, 'Finished caching game turn data!')
    });
    logger.info({ gameName }, 'Transaction committed for game!')
  } catch (error) {
    logger.error({ gameName, error }, 'Transaction rolled back due to error!')
  }
}

export default tickGame