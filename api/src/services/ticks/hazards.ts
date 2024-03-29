import db, { Game } from '../../models';
import { logger } from '../../logging'
import { ClockContext } from '../../types';
import { gameSeededRandom } from '../ticks/shared';
import { rollDice } from '../../diceparser';
import { Model } from 'sequelize';

type BaseHazard = {
  name: string
  title: string
  label: string
  color: string
  kind: string
}

const animals = [
  {
    title: 'Raccoon',
    label: 'A stray raccoon is running loose'
  },
  {
    title: 'Dog',
    label: 'A stray dog is running loose'
  },
  {
    title: 'Javelina',
    label: 'A stray javelina is running loose'
  },
  {
    title: 'Deer',
    label: 'A stray deer is running loose'
  },
  {
    title: 'Shadowy Form',
    label: 'A shadowy form looms ominously'
  },
]

const debris = [
  {
    title: 'Rubble',
    label: 'A bunch of rubble'
  },
  {
    title: 'Debris on Track',
    label: 'Some sort of debris on the track'
  },
  {
    title: 'Damaged Track',
    label: 'A damaged track'
  },
  {
    title: 'Exposed Electrical Cables',
    label: 'Some exposed electrical cables'
  },
]

// TODO: Move somewhere else
// TODO: Add more random hazards
const baseHazards: Record<string, (game: Model<Game>) => BaseHazard> = {
  'mystery-slime': (game) => {
    return {
      name: 'mystery-slime',
      title: 'Mystery Slime',
      label: 'Some sort of mystery slime',
      color: '#d76cff',
      kind: 'stop',
    }
  },
  'debris': (game) => {
    const item = debris[Math.floor(gameSeededRandom(game) * debris.length)]
    return {
      name: 'debris',
      ...item,
      color: '#cc0000',
      kind: 'stop',
    }
  },
  'stray-animal': (game) => {
    const animal = animals[Math.floor(gameSeededRandom(game) * animals.length)]
    return {
      name: 'stray-animal',
      ...animal,
      color: '#404040',
      kind: 'stop',
    }
  }
}

async function createRandomHazard(context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards } = context
  const { id: gameId, name: gameName, turnNumber, currentTime } = game.dataValues

  // Only five hazards in play at a time
  if (hazards.length > 5) {
    return
  }

  const hop = hops[Math.floor(gameSeededRandom(game) * hops.length)]
  if (!hop) {
    logger.error(
      {
        gameName,
        turnNumber
      },
      'Could not create random hazard because no hop could be found!'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      currentTime,
      message: `Could not create random hazard because no hop could be found!`
    })
    return
  }

  const distance = Math.floor(gameSeededRandom(game) * hop.dataValues.length)
  const baseHazardNames = Object.keys(baseHazards)
  const baseHazardName = baseHazardNames[Math.floor(gameSeededRandom(game) * baseHazardNames.length)]
  const baseHazard = baseHazards[baseHazardName](game)
  if (!baseHazard) {
    logger.error(
      {
        gameName,
        turnNumber,
        baseHazardName
      },
      'Could not create random hazard because no prototypal hazard could be found!'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      currentTime,
      message: `Could not create random hazard because no prototypal hazard could be found!`
    })
    return
  }

  const hazard = await db.models.Hazard.create({
    name: `${baseHazard.name}:${hop.dataValues.id}:${distance}`,
    title: baseHazard.title,
    label: baseHazard.label,
    color: baseHazard.color,
    kind: baseHazard.kind,
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
    currentTime,
    message: `A new hazard ${hazard.dataValues.name} appeared!`
  })
}

async function destroyRandomHazard(context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards } = context
  const { id: gameId, name: gameName, turnNumber, currentTime } = game.dataValues

  const hazard = hazards[Math.floor(gameSeededRandom(game) * hazards.length)]
  if (!hazard) {
    return
  }
  
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
    currentTime,
    message: `The hazard ${hazard.dataValues.name} went away!`
  })
  await hazard.destroy()
}

async function tickHazards(context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards } = context
  const { id: gameId, name: gameName, turnNumber, currentTime } = game.dataValues

  // Chance to generate a persistent hazard
  if (gameSeededRandom(game) < 0.05) {
    await createRandomHazard(context)
  }
  // Chance to destroy a persistent hazard
  if (gameSeededRandom(game) < 0.05) {
    await destroyRandomHazard(context)
  }
}

export { tickHazards }