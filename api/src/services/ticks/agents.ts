import db, { Agent, Game, Hazard, Hop, Item, Line, Station, Train } from '../../models';
import { Model, Op, Sequelize } from 'sequelize';
import { logger } from '../../logging'
import { rollDice } from '../../diceparser';
import { ClockContext } from '../../types';
import { findRandomPath, gameSeededRandom } from './shared';

// Skill Check Example
//   you.willpower <= Math.floor(Math.random() * 20.0)
//
// Multiple agents in the same station
// * Roll for initiative
// * Until one or no agents are left:
//   * Each roll for damage (assume 1d6 to start)
//   * If an agent reaches 0 HP, they respawn from a starting point
//   * Agents will not board trains until combat is finished
//
// Agents in combat are handled separately before other agents

async function willTravelingAgentDisembark(agent: Model<Agent>, context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards, items } = context
  const { id: gameId, name: gameName, turnNumber } = game.dataValues
  logger.warn('Traveling agent determining whether to disembark')

  const train = trains.find((train) => train.dataValues.id === agent.dataValues.trainId)
  if (!train) {
    logger.error('No train found when agent was determining whether to disembark')
    return false
  }
  
  const station = stations.find((station) => station.dataValues.id === train.dataValues.stationId)
  const destination = stations.find((station) => station.dataValues.end)
  if (!station || !destination) {
    logger.error('No station or destination found when agent was determining whether to disembark')
    return false
  }

  const path = await findRandomPath(station, destination, context)
  if (!path) {
    logger.error('Could not predict a path when agent was determining whether to disembark')
    return false
  }
  const nextStation = path[1]
  if (!nextStation) {
    logger.error('Could not find a next station when agent was determining whether to disembark')
    return false
  }

  // Disembark if there are no hops where:
  // * Head is the current station
  // * Tail is the projected next station
  // * Line is the same as the train the agent is riding
  const nextHop = hops
  .filter((hop) => hop.dataValues.headId === station.dataValues.id)
  .filter((hop) => hop.dataValues.tailId === nextStation.dataValues.id)
  .find((hop) => hop.dataValues.lineId === train.dataValues.lineId)
  
  return !nextHop
}

async function willStationedAgentBoardTrain(agent: Model<Agent>, train: Model<Train>, context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards, items } = context
  const { id: gameId, name: gameName, turnNumber } = game.dataValues
  logger.warn('Stationed agent determining whether to hop on train')
  const station = stations.find((station) => station.dataValues.id === agent.dataValues.stationId)
  if (!station) {
    logger.error('Could not find a station when agent was determining whether to hop on train')
    return false
  }
  const nextHops = hops
  .filter((hop) => hop.dataValues.headId === station.dataValues.id)
  .filter((hop) => hop.dataValues.lineId === train.dataValues.lineId)
  const nextStations = nextHops
  .map((hop) => stations.find((nextStation) => nextStation.dataValues.id === hop.dataValues.tailId))

  for (let nextStation of nextStations) {
    if (!nextStation) {
      continue
    }
    const path = await findRandomPath(station, nextStation, context)
    if (path) {
      return true
    }
  }

  logger.error('Could not find a path when agent was determining whether to hop on train')
  return false
}

async function tickStationedAgentFightingPullStuntWitheringGaze(agent: Model<Agent>, station: Model<Station>, otherAgent: Model<Agent>, context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards, items } = context
  const { id: gameId, name: gameName, turnNumber } = game.dataValues

  // A Withering Gaze: If in combat: Other agent rolls against willpower or is stunned for 1d4 turns.
  const roll = Math.floor(gameSeededRandom(game) * 20.0) + 1 < otherAgent.dataValues.willpower
  if (!roll) {
    logger.error(
      {
        gameName,
        turnNumber,
        agentName: agent.dataValues.name
      },
      'Stationed agent in combat failed to pull A Withering Gaze!'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `Stationed agent ${agent.dataValues.title} in combat failed to pull A Withering Gaze.`
    })
    return
  }

  const turns = Math.floor(gameSeededRandom(game) * 4.0) + 1
  otherAgent.set('stunTimeout', turns)
  logger.error(
    {
      gameName,
      turnNumber,
      agentName: agent.dataValues.name
    },
    'Stationed agent in combat pulled A Withering Gaze!'
  )
  await db.models.Message.create({
    gameId,
    turnNumber,
    message: `Stationed agent ${agent.dataValues.title} in combat pulled A Withering Gaze. ${otherAgent.dataValues.title} is stunned for ${turns} turns!`
  })
}

async function tickStationedAgentFightingPullStuntFlashback(agent: Model<Agent>, station: Model<Station>, otherAgent: Model<Agent>, context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards, items } = context
  const { id: gameId, name: gameName, turnNumber } = game.dataValues

  // A Flashback: If in combat: Other agent rolls against strength or get thrown to a neighboring disadvantageous station
  const roll = Math.floor(gameSeededRandom(game) * 20.0) + 1 < otherAgent.dataValues.strength
  if (!roll) {
    logger.error(
      {
        gameName,
        turnNumber,
        agentName: agent.dataValues.name
      },
      'Stationed agent in combat failed to pull A Flashback!'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `Stationed agent ${agent.dataValues.title} in combat failed to pull A Flashback.`
    })
    return
  }

  const nextHops = hops
  .filter((h) => h.dataValues.headId === station.dataValues.id)
  const nextStations = stations
  .filter((s) => nextHops.find((h) => s.dataValues.id === h.dataValues.tailId))

  const idToDistances: Record<number, number | undefined> = {}
  for (let s of nextStations) {
    idToDistances[s.dataValues.id] = (await findRandomPath(station, s, context))?.length
  }

  const nextPairs = nextStations
  .sort((a, b) => {
    const distanceA = idToDistances[a.dataValues.id]
    const distanceB = idToDistances[b.dataValues.id]
    if(!distanceA || !distanceB) {
      return 0
    }
    return distanceB - distanceA // reverse order, high-to-low
  })
  const nextStation = nextStations[0]
  if (!nextStation) {
    logger.error(
      {
        gameName,
        turnNumber,
        agentName: agent.dataValues.name
      },
      'Stationed agent in combat failed to pull A Flashback because a station could not be found!'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `Stationed agent ${agent.dataValues.title} in combat failed to pull A Flashback because a station could not be found.`
    })
    return
  }

  otherAgent.set('stationId', nextStation.dataValues.id)
  otherAgent.set('trainId', null)
  otherAgent.save()

  logger.error(
    {
      gameName,
      turnNumber,
      agentName: agent.dataValues.name
    },
    'Stationed agent in combat pulled A Flashback!'
  )
  await db.models.Message.create({
    gameId,
    turnNumber,
    message: `Stationed agent ${agent.dataValues.title} in combat pulled A Flashback. ${otherAgent.dataValues.title} was knocked to ${nextStation.dataValues.title}!`
  })
}

async function tickStationedAgentFightingPullStuntTheOlSlip(agent: Model<Agent>, station: Model<Station>, otherAgent: Model<Agent>, context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards, items } = context
  const { id: gameId, name: gameName, turnNumber } = game.dataValues

  // The Ol' Slip: If in combat: Roll against dex to attempt to board a train on a line connecting to this station
  const roll = Math.floor(gameSeededRandom(game) * 20.0) + 1 < agent.dataValues.dexterity
  if (!roll) {
    logger.error(
      {
        gameName,
        turnNumber,
        agentName: agent.dataValues.name
      },
      'Stationed agent in combat failed to pull The Ol\' Slip!'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `Stationed agent ${agent.dataValues.title} in combat failed to pull The Ol\' Slip.`
    })
    return
  }

  const lineIds = hops.filter((h) => h.dataValues.headId === station.dataValues.id).map((h) => h.dataValues.lineId)
  const nextTrains = trains
  .filter((t) => lineIds.find((li) => li === t.dataValues.lineId))
  const nextTrain = nextTrains[Math.floor(gameSeededRandom(game) * nextTrains.length)]
  if (!nextTrain) {
    logger.error(
      {
        gameName,
        turnNumber,
        agentName: agent.dataValues.name
      },
      'Stationed agent in combat failed to pull The Ol\' Slip because no train could be found!'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `Stationed agent ${agent.dataValues.title} in combat failed to pull The Ol\' Slip because no train could be found.`
    })
    return
  }

  otherAgent.set('stationId', null)
  otherAgent.set('trainId', nextTrain.dataValues.id)
  otherAgent.save()

  logger.error(
    {
      gameName,
      turnNumber,
      agentName: agent.dataValues.name
    },
    'Stationed agent in combat pulled The Ol\' Slip!'
  )
  await db.models.Message.create({
    gameId,
    turnNumber,
    message: `Stationed agent ${agent.dataValues.title} in combat pulled The Ol' Slip. ${agent.dataValues.title} jumped to ${nextTrain.dataValues.title}!`
  })
}

async function tickStationedAgentFightingPullStunt(agent: Model<Agent>, station: Model<Station>, otherAgents: Model<Agent>[], context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards, items } = context
  const { id: gameId, name: gameName, turnNumber } = game.dataValues

  const otherAgent = otherAgents[Math.floor(gameSeededRandom(game) * otherAgents.length)]
  if (!otherAgent) {
    logger.error(
      {
        gameName,
        turnNumber,
        agentName: agent.dataValues.name
      },
      'Stationed agent in combat tried to pull a stunt, but could not find someone to fight!'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `Stationed agent ${agent.dataValues.title} in combat tried to pull a stunt, but could not find someone to fight!`
    })
    return
  }

  const stuntIndex = Math.floor(gameSeededRandom(game) * 3.0)
  if (stuntIndex === 0) {
    await tickStationedAgentFightingPullStuntWitheringGaze(agent, station, otherAgent, context)
  }
  else if (stuntIndex === 1) {
    await tickStationedAgentFightingPullStuntFlashback(agent, station, otherAgent, context)
  }
  else {
    await tickStationedAgentFightingPullStuntTheOlSlip(agent, station, otherAgent, context)
  }
}

async function tickStationedAgentFightingMelee(agent: Model<Agent>, station: Model<Station>, otherAgent: Model<Agent>, context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards, items } = context
  const { id: gameId, name: gameName, turnNumber } = game.dataValues
  
  const weapon = items
  .filter((item) => item.dataValues.agentId === agent.dataValues.id)
  .find((item) => item.dataValues.kind === 'weapon')
  let damage: string = '1d4'
  if (weapon && weapon.dataValues.damage) {
    damage = weapon.dataValues.damage
  }

  const { sum, dice } = rollDice(damage)
  otherAgent.dataValues.currentHp = otherAgent.dataValues.currentHp - sum
  if (otherAgent.dataValues.currentHp <= 0) {
    const startingStations = stations.filter((s) => s.dataValues.start)
    const startingStation = startingStations[Math.floor(gameSeededRandom(game) * startingStations.length)]
    if (!startingStation) {
      logger.error(
        {
          gameName,
          turnNumber,
          agentName: agent.dataValues.name,
          otherAgentName: otherAgent.dataValues.name,
          damage: sum,
          dice
        },
        'Stationed agent in combat knocked someone out, and they could not be reincarnated!'
      )
      await db.models.Message.create({
        gameId,
        turnNumber,
        message: `Stationed agent ${agent.dataValues.title} in combat knocked ${otherAgent.dataValues.title} out, and they could not be reincarnated!`
      })
      return
    }

    logger.warn(
      {
        gameName,
        turnNumber,
        agentName: agent.dataValues.name,
        otherAgentName: otherAgent.dataValues.name,
        stationName: station.dataValues.name,
        damage: sum,
        dice
      },
      'Stationed agent in combat knocked someone out, and they are being reincarnated!'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `Stationed agent ${agent.dataValues.title} in combat knocked ${otherAgent.dataValues.title} out, and they are being reincarnated at ${startingStation.dataValues.title}!`
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
      agentName: agent.dataValues.name,
      otherAgentName: otherAgent.dataValues.name,
      damage: sum,
      dice
    },
    'Stationed agent in combat struck someone!'
  )
  await db.models.Message.create({
    gameId,
    turnNumber,
    message: `Stationed agent ${agent.dataValues.title} in combat struck ${otherAgent.dataValues.title}!`
  })
  otherAgent.set('currentHp', otherAgent.dataValues.currentHp - sum)
  await otherAgent.save()
}

// TODO: Add more logic
// TODO: Roll a dice to figure out action in turn
// TODO: Defense?
// Ideas for stunts
// * A Withering Gaze: If in combat: Roll against willpower to attempt to stun enemy for 1d4 turns.
// * A Flashback: If in combat: Roll against strength to throw an opponent to a neighboring disadvantageous station
// * The Ol' Slip: If in combat: Roll against dex to attempt to board nearest train
// More hazard types
async function tickStationedAgentFighting(agent: Model<Agent>, station: Model<Station>, otherAgents: Model<Agent>[], context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards, items } = context
  const { id: gameId, name: gameName, turnNumber } = game.dataValues

  const pullStunt = gameSeededRandom(game) < 0.2
  if (pullStunt) {
    await tickStationedAgentFightingPullStunt(agent, station, otherAgents, context)
    return
  }

  const otherAgent = otherAgents[Math.floor(gameSeededRandom(game) * otherAgents.length)]
  if (!otherAgent) {
    logger.error(
      {
        gameName,
        turnNumber,
        agentName: agent.dataValues.name
      },
      'Stationed agent in combat tried to fight someone, but could not find someone to fight!'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `Stationed agent ${agent.dataValues.title} in combat tried to fight someone, but could not find someone to fight!`
    })
    return
  }

  await tickStationedAgentFightingMelee(agent, station, otherAgent, context)
}

async function tickTravelingAgent(agent: Model<Agent>, context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards, items } = context
  const { id: gameId, name: gameName, turnNumber } = game.dataValues
  const train = trains.find((train) => train.dataValues.id === agent.dataValues.trainId)
  if (!train) {
    // Error state. Traveling agent without a train
    logger.error(
      {
        gameName,
        turnNumber,
        agentName: agent.dataValues.name
      },
      'Traveling agent is traveling without a train!'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `Traveling agent ${agent.dataValues.title} is traveling without a train!`
    })
    return
  }

  const station = stations.find((station) => station.dataValues.id === train.dataValues.stationId)
  if (!station) {
    // Agent on traveling train is traveling
    logger.info(
      {
        gameName,
        turnNumber,
        agentName: agent.dataValues.name,
        trainName: train.dataValues.name
      },
      'Traveling agent is traveling on train'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `Traveling agent ${agent.dataValues.title} is traveling on ${train.dataValues.title}.`
    })
    return
  }

  if (station.dataValues.end) {
    // Agent on stationed train has reached destination and disembarks train
    logger.info(
      {
        gameName,
        turnNumber,
        agentName: agent.dataValues.name,
        trainName: train.dataValues.name,
        stationName: station.dataValues.name
      },
      'Traveling agent has found their destination! Disembarking...'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `Traveling agent ${agent.dataValues.title} has found their destination, ${station.dataValues.title} and is disembarking from train ${station.dataValues.title}.`
    })
    agent.set('trainId', null)
    agent.set('stationId', station.dataValues.id)
    return
  }

  // TODO: Some sort of strategy
  // Agent on stationed train has not yet reached destination
  const mightDisembarkTrain = await willTravelingAgentDisembark(agent, context);
  if (mightDisembarkTrain) {
    // Agent on stationed train is disembarking at station
    if (station.dataValues.virtual) {
      // Agents will not disembark from virtual stations
      logger.warn({
        gameName,
        turnNumber,
        agentName: agent.dataValues.name,
        trainName: train.dataValues.name,
        stationName: station.dataValues.name
      },
        'Traveling agent will not be disembarking train to virtual station'
      )
      await db.models.Message.create({
        gameId,
        turnNumber,
        message: `Traveling agent ${agent.dataValues.title} will not be disembarking ${train.dataValues.title} at service station ${station.dataValues.title}!`
      })
      return
    }

    // TODO: Have better logic for this
    // Agent disembarks train
    logger.info(
      {
        gameName,
        turnNumber,
        agentName: agent.dataValues.name,
        trainName: train.dataValues.name,
        stationName: station.dataValues.name
      },
      'Traveling agent is disembarking train to station'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `Traveling agent ${agent.dataValues.title} is disembarking ${train.dataValues.title} at station ${station.dataValues.title}.`
    })
    agent.set('trainId', null)
    agent.set('stationId', station.dataValues.id)
    return
  }

  // Agent on stationed train is staying put
  logger.info(
    {
      gameName,
      turnNumber,
      agentName: agent.dataValues.name,
      trainName: train.dataValues.name,
      stationName: station.dataValues.name
    },
    'Traveling agent is staying on stationed train'
  )
  await db.models.Message.create({
    gameId,
    turnNumber,
    message: `Traveling agent ${agent.dataValues.title} is staying on ${train.dataValues.title} at station ${station.dataValues.title}.`
  })
}

async function tickStationedAgent(agent: Model<Agent>, context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards, items } = context
  const { id: gameId, name: gameName, turnNumber } = game.dataValues

  const station = stations.find((station) => station.dataValues.id === agent.dataValues.stationId)
  if (!station) {
    logger.error(
      {
        gameName,
        turnNumber,
        agentName: agent.dataValues.name
      },
      'Stationed agent is stationed, but the station cannot be found'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `Stationed agent ${agent.dataValues.title} is without a station!`
    })
    return
  }

  // If there are other agents in station, they will fight instead of other actions
  const otherAgents = agents
  .filter((a) => a.dataValues.id !== agent.dataValues.id)
  .filter((a) => a.dataValues.stationId === agent.dataValues.stationId)
  if (!station.dataValues.start && !station.dataValues.end && otherAgents.length > 0) {
    await tickStationedAgentFighting(agent, station, otherAgents, context)
    return
  }

  if (station.dataValues.end) {
    // Stationed agent in a station with no trains, is waiting
    logger.info(
      {
        gameName,
        turnNumber,
        agentName: agent.dataValues.name,
        stationName: station.dataValues.name
      },
      'Stationed agent is waiting at destination'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `Stationed agent ${agent.dataValues.title} is waiting at their destination, ${station.dataValues.title}.`
    })
    return
  }

  const trainsInStation = trains.filter((train) => station.dataValues.id === train.dataValues.stationId)
  const trainToBoard = trainsInStation[Math.floor(gameSeededRandom(game) * trainsInStation.length)]
  if (trainsInStation.length === 0) {
    // Stationed agent in a station with no trains, is waiting
    logger.info(
      {
        gameName,
        turnNumber,
        agentName: agent.dataValues.name,
        stationName: station.dataValues.name
      },
      'Stationed agent is waiting at station'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `Stationed agent ${agent.dataValues.title} is waiting at ${station.dataValues.title}.`
    })
    return
  }
  
  // TODO: Some sort of strategy
  const mightBoardTrain = await willStationedAgentBoardTrain(agent, trainToBoard, context)
  if (mightBoardTrain) {
    // Stationed agent choosing to board a train
    if (station.dataValues.virtual) {
      // If station is virtual, agent will not board train
      logger.error(
        {
          gameName,
          turnNumber,
          agentName: agent.dataValues.name,
          stationName: station.dataValues.name,
          trainName: trainToBoard.dataValues.name
        },
        'Stationed agent attempted to board train, but is trapped in virtual station'
      )
      await db.models.Message.create({
        gameId,
        turnNumber,
        message: `Stationed agent ${agent.dataValues.title} attempted to board ${trainToBoard.dataValues.title}, but is trapped at service station ${station.dataValues.title}!`
      })
      return
    }
    
    // Stationed agent in a station with trains, will board a train
    logger.info(
      {
        gameName,
        turnNumber,
        agentName: agent.dataValues.name,
        stationName: station.dataValues.name,
        trainName: trainToBoard.dataValues.name
      },
      'Stationed agent at station is boarding train'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `Stationed agent ${agent.dataValues.title} is boarding ${trainToBoard.dataValues.title} from ${station.dataValues.title}!`
    })
    agent.set('stationId', null)
    agent.set('trainId', trainToBoard.dataValues.id)
    return
  }

  // Stationed agent in a station with trains, is waiting
  logger.info(
    {
      gameName,
      turnNumber,
      agentName: agent.dataValues.name,
      stationName: station.dataValues.name
    },
    'Stationed agent is waiting at station with waiting trains'
  )
  await db.models.Message.create({
    gameId,
    turnNumber,
    message: `Stationed agent ${agent.dataValues.title} is waiting for trains in ${station.dataValues.title}.`
  })
}

async function tickAgents(context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards, items } = context
  const { id: gameId, name: gameName, turnNumber } = game.dataValues

  // Agent phase
  for (let agent of agents) {
    if (agent.dataValues.timeout > 0) {
      agent.set('timeout', agent.dataValues.timeout - 1)
      await agent.save()
      continue
    }
    if (agent.dataValues.stunTimeout > 0) {
      agent.set('stunTimeout', agent.dataValues.stunTimeout - 1)
      await agent.save()
      continue
    }
    
    // Traveling agent
    if (agent.dataValues.trainId) {
      await tickTravelingAgent(agent, context)
      await agent.save()
    }
    // Stationed agent
    else if (agent.dataValues.stationId) {
      await tickStationedAgent(agent, context)
      await agent.save()
    }
    // An agent is "out-of-bounds" if not traveling or stationed.
    else {
      logger.error({ gameName, turnNumber, agentName: agent.dataValues.name }, 'Agent is out-of-bounds. Skipping!')
    }
  }
}

export { tickAgents }