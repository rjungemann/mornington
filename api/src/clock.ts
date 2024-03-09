import dotenv from 'dotenv';
import db, { Agent, Game, Hazard, Hop, Item, Line, Station, Train } from './models';
import { Model, Op, Sequelize } from 'sequelize';
import { logger } from './logging'
import createGameTurn from './services/createGameTurn';
import { rollDice } from './diceparser';

dotenv.config();

type ClockContext = {
  db: Sequelize
  gameId: number
  gameName: string
  turnNumber: number
  lines: Model<Line>[]
  trains: Model<Train>[]
  hops: Model<Hop>[]
  stations: Model<Station>[]
  agents: Model<Agent>[]
  hazards: Model<Hazard>[]
  items: Model<Item>[]
}

const runOnce: boolean = Boolean( process.env.RUN_ONCE && process.env.RUN_ONCE.toLowerCase() !== 'false' )
const parallel: boolean = Boolean( process.env.PARALLEL && process.env.PARALLEL.toLowerCase() !== 'false' )
const tickInterval: number = parseInt(process.env.TICK_INTERVAL || '5000', 10)

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

// TODO: Add "depth" option
async function findRandomPath(source: Model<Station>, destination: Model<Station>, context: ClockContext): Promise<Model<Station>[] | undefined> {
  const { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards, items } = context
  const maxTries = 10
  for (let i = 0; i < maxTries; i++) {
    let current: Model<Station> | undefined = source
    let path: Model<Station>[] = []
    while (true) {
      if (!current) {
        break
      }
      path.push(current)
      if (current.dataValues.id === destination.dataValues.id) {
        return path
      }
      const nextHops = hops.filter((hop) => hop.dataValues.headId === current!.dataValues.id)
      const nextHop = nextHops[Math.floor(Math.random() * nextHops.length)]
      if (nextHop) {
        current = stations
          .filter((station) => !path.some((s) => s.dataValues.id === station.dataValues.id))
          .find((station) => station.dataValues.id === nextHop.dataValues.tailId)
      }
      else {
        break
      }
    }
  }
  return
}

async function tickTravelingTrain(train: Model<Train>, context: ClockContext) {
  const { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards, items } = context
  const hop = hops.find((hop) => hop.dataValues.id === train.dataValues.hopId)
  if (hop) {
    const hazard = hazards
    .filter((hazard) => hazard.dataValues.hopId === hop.dataValues.id)
    .find((hazard) => train.dataValues.distance >= hazard.dataValues.distance)
    if (hazard) {
      // Encountered hazard. Hold position.
      logger.warn(
        {
          gameName,
          turnNumber,
          hopName: hop.dataValues.name,
          trainName: train.dataValues.name
        },
        'Traveling train has encountered a hazard. Holding...'
      )
      await db.models.Message.create({
        gameId,
        turnNumber,
        message: `Traveling train ${train.dataValues.title} has encountered a ${hazard.dataValues.title}! Holding...`
      })
    }
    else {
      if (train.dataValues.distance >= hop.dataValues.length) {
        // Train has reached end of hop
        const station = stations.find((station) => station.dataValues.id === hop.dataValues.tailId)
        if (station) {
          // Filter out current train
          // Only consider trains of the same line
          // Filter down to trains in current station
          const otherTrain = trains
            .filter((otherTrain) => otherTrain.dataValues.id !== train.dataValues.id)
            .filter((otherTrain) => otherTrain.dataValues.lineId !== train.dataValues.lineId)
            .find((otherTrain) => otherTrain.dataValues.stationId === station.dataValues.id)
          if (otherTrain) {
            // There's another train of the same line already in the station
            logger.warn(
              {
                gameName,
                turnNumber,
                trainName: train.dataValues.name,
                otherTrainName: otherTrain.dataValues.name,
                stationName: station.dataValues.name,
                hopName: hop.dataValues.name
              },
              'Traveling train is attempting to stop in station, but there is another train! Holding...'
            )
            await db.models.Message.create({
              gameId,
              turnNumber,
              message: `Traveling train ${train.dataValues.title} is attempting to stop at ${station.dataValues.title}, but ${train.dataValues.title} is in the way!`
            })
          }
          else {
            // Found a station to transfer to. Will transfer
            logger.info(
              {
                gameName,
                turnNumber,
                trainName: train.dataValues.name,
                stationName: station.dataValues.name,
                hopName: hop.dataValues.name
              },
              'Traveling train is stopping in station.'
            )
            await db.models.Message.create({
              gameId,
              turnNumber,
              message: `Traveling train ${train.dataValues.title} is stopping at ${station.dataValues.title}.`
            })
            train.set('hopId', null)
            train.set('stationId', station.dataValues.id)
            train.set('currentWaitTime', 0)
            train.set('distance', 0)
          }
        }
        else {
          // Could not find station to transfer to. Hold position.
          logger.warn(
            {
              gameName,
              turnNumber,
              hopName: hop.dataValues.name,
              trainName: train.dataValues.name
            },
            'Traveling train could not find a station to transfer to. Holding...'
          )
          await db.models.Message.create({
            gameId,
            turnNumber,
            message: `Traveling train ${train.dataValues.title} could not find station to transfer to! Holding...`
          })
        }
      }
      else {
        // Traveling normally
  
        // Filter out current train
        // Only consider trains of the same line
        // Filter down to trains in the same hop
        // Filter down to trains ahead of current train
        // Filter down to trains which *would be behind* of current train, if it moves
        const overtakenTrain = trains
          .filter((otherTrain) => otherTrain.dataValues.id !== train.dataValues.id)
          .filter((otherTrain) => otherTrain.dataValues.lineId !== train.dataValues.lineId)
          .filter((otherTrain) => otherTrain.dataValues.hopId === train.dataValues.hopId)
          .filter((otherTrain) => train.dataValues.distance < otherTrain.dataValues.distance)
          .find((otherTrain) => train.dataValues.distance + train.dataValues.speed >= otherTrain.dataValues.distance)
        if (overtakenTrain) {
          // Train would overtake another train. Holding position
          logger.warn(
            {
              gameName,
              turnNumber,
              hopName: hop.dataValues.name,
              trainName: train.dataValues.name,
              otherTrainName: overtakenTrain.dataValues.name,
            },
            'Traveling train would overtake another train. Holding...'
          )
          await db.models.Message.create({
            gameId,
            turnNumber,
            message: `Traveling train ${train.dataValues.title} would overtake ${overtakenTrain.dataValues.title}! Holding...`
          })
        }
        else {
          // Train traveling normally
          train.set('distance', train.dataValues.distance + train.dataValues.speed)
          logger.info(
            {
              gameName,
              turnNumber,
              trainName: train.dataValues.name,
              hopName: hop.dataValues.name
            },
            'Traveling train traveling normally'
          )
          await db.models.Message.create({
            gameId,
            turnNumber,
            message: `Traveling train ${train.dataValues.title} is traveling normally.`
          })
        }
      }
    }
  } else {
    logger.warn(
      {
        gameName,
        turnNumber,
        trainName: train.dataValues.name
      },
      'Traveling train has no hops to hop on!',
      train.dataValues.name
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `Traveling train ${train.dataValues.title} has no hops to transfer to!`
    })
  }
}

async function tickStationedTrain(train: Model<Train>, context: ClockContext) {
  const { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards, items } = context
  const station = stations.find((station) => station.dataValues.id === train.dataValues.stationId)
  if (station) {
    if (station.dataValues.virtual) {
      // Trains depart virtual stations immediately

      // Filter down to hops heading from this station
      // Filter down to hops of same line as train
      // Filter out other hops which have trains at distance 0
      const nextHops = hops
        .filter((hop) => hop.dataValues.headId === station.dataValues.id)
        .filter((hop) => hop.dataValues.lineId === train.dataValues.lineId)
        .filter((hop) => (
          // Find all trains that *don't* match the criteria:
          // * Filter out current train
          // * Only consider trains of the same line
          // * Filter down to trains in the same hop
          // * Filter down to trains that haven't moved in the hop
          !trains
            .filter((otherTrain) => otherTrain.dataValues.id !== train.dataValues.id)
            .filter((otherTrain) => otherTrain.dataValues.lineId !== hop.dataValues.lineId)
            .filter((otherTrain) => otherTrain.dataValues.hopId === hop.dataValues.id)
            .some((otherTrain) => otherTrain.dataValues.distance === 0)
        ))
      const hop = nextHops[Math.floor(Math.random() * nextHops.length)]
      if (hop) {
        train.set('hopId', hop.dataValues.id)
        train.set('stationId', null)
        train.set('currentWaitTime', 0)
        train.set('distance', 0)
        logger.info(
          {
            gameName,
            turnNumber,
            trainName: train.dataValues.name,
            stationName: station.dataValues.name,
            hopName: hop.dataValues.name
          },
          'Stationed train deparating virtual station!'
        )
        await db.models.Message.create({
          gameId,
          turnNumber,
          message: `Stationed train ${train.dataValues.title} is departing service station ${station.dataValues.title}.`
        })
      }
      else {
        logger.warn(
          {
            gameName,
            turnNumber,
            trainName: train.dataValues.name,
            stationName: station.dataValues.name
          },
          'Stationed train has no hops to depart from in this virtual station!'
        )
        await db.models.Message.create({
          gameId,
          turnNumber,
          message: `Stationed train ${train.dataValues.title} has no hops to transfer to from ${station.dataValues.title}!`
        })
      }
    }
    else {
      if (train.dataValues.currentWaitTime >= train.dataValues.maxWaitTime) {
        // Train is departing

        // Filter down to hops heading from this station
        // Filter down to hops of same line as train
        // Filter out other hops which have trains at distance 0
        const nextHops = hops
          .filter((hop) => hop.dataValues.headId === station.dataValues.id)
          .filter((hop) => hop.dataValues.lineId === train.dataValues.lineId)
          .filter((hop) => (
            // Find all trains that *don't* match the criteria:
            // * Filter out current train
            // * Only consider trains of the same line
            // * Filter down to trains in the same hop
            // * Filter down to trains that haven't moved in the hop
            !trains
              .filter((otherTrain) => otherTrain.dataValues.id !== train.dataValues.id)
              .filter((otherTrain) => otherTrain.dataValues.lineId !== hop.dataValues.lineId)
              .filter((otherTrain) => otherTrain.dataValues.hopId === hop.dataValues.id)
              .some((otherTrain) => otherTrain.dataValues.distance === 0)
          ))
        const hop = nextHops[Math.floor(Math.random() * nextHops.length)]
        if (hop) {
          train.set('hopId', hop.dataValues.id)
          train.set('stationId', null)
          train.set('currentWaitTime', 0)
          train.set('distance', 0)
          logger.info(
            {
              gameName,
              turnNumber,
              trainName: train.dataValues.name,
              stationName: train.dataValues.name,
              hopName: hop.dataValues.name
            },
            'Departing train jumped to hop from station!'
          )
          await db.models.Message.create({
            gameId,
            turnNumber,
            message: `Stationed train ${train.dataValues.title} is departing from ${station.dataValues.title}.`
          })
        }
        else {
          logger.warn(
            {
              gameName,
              turnNumber,
              trainName: train.dataValues.name,
              stationName: station.dataValues.name
            },
            'Stationed train wants to depart but has no hops to depart on!'
          )
          await db.models.Message.create({
            gameId,
            turnNumber,
            message: `Stationed train ${train.dataValues.title} wants to depart ${station.dataValues.title} but there are no hops to depart from!`
          })
        }
      }
      else {
        // Train is waiting
        train.set('currentWaitTime', train.dataValues.currentWaitTime + 1)
        logger.info(
          {
            gameName,
            turnNumber,
            trainName: train.dataValues.name,
            stationName: station.dataValues.name
          },
          'Stationed train is waiting in station'
        )
        await db.models.Message.create({
          gameId,
          turnNumber,
          message: `Stationed train ${train.dataValues.title} is waiting in ${station.dataValues.title}.`
        })
      }
    }
  }
  else {
    logger.error(
      {
        gameName,
        turnNumber,
        trainName: train.dataValues.name
      },
      'Stationed train has no station!'
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `Stationed train ${train.dataValues.title} has no station!`
    })
  }
}

async function willTravelingAgentDisembark(agent: Model<Agent>, context: ClockContext) {
  const { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards, items } = context
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
  const { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards, items } = context
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

async function tickStationedAgentFightingPullStunt(agent: Model<Agent>, station: Model<Station>, otherAgents: Model<Agent>[], context: ClockContext) {
  const { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards, items } = context

  const otherAgent = otherAgents[Math.floor(Math.random() * otherAgents.length)]
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

  const stuntIndex = Math.floor(Math.random() * 3.0)
  if (stuntIndex === 0) {
    // A Withering Gaze: If in combat: Other agent rolls against willpower or is stunned for 1d4 turns.
    const roll = Math.floor(Math.random() * 20.0) + 1 < otherAgent.dataValues.willpower
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

    const turns = Math.floor(Math.random() * 4.0) + 1
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
  else if (stuntIndex === 1) {
    // A Flashback: If in combat: Other agent rolls against strength or get thrown to a neighboring disadvantageous station
    const roll = Math.floor(Math.random() * 20.0) + 1 < otherAgent.dataValues.strength
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
  else {
    // The Ol' Slip: If in combat: Roll against dex to attempt to board a train on a line connecting to this station
    const roll = Math.floor(Math.random() * 20.0) + 1 < agent.dataValues.dexterity
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
    const nextTrain = nextTrains[Math.floor(Math.random() * nextTrains.length)]
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
  const { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards, items } = context

  const pullStunt = Math.random() < 0.2
  if (pullStunt) {
    await tickStationedAgentFightingPullStunt(agent, station, otherAgents, context)
    return
  }

  const otherAgent = otherAgents[Math.floor(Math.random() * otherAgents.length)]
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
    const startingStation = startingStations[Math.floor(Math.random() * startingStations.length)]
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

async function tickTravelingAgent(agent: Model<Agent>, context: ClockContext) {
  const { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards, items } = context
  const train = trains.find((train) => train.dataValues.id === agent.dataValues.trainId)
  if (train) {
    const station = stations.find((station) => station.dataValues.id === train.dataValues.stationId)
    if (station) {
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
      }
      else {
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
          } else {
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
          }
        }
        else {
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
      }
    }
    else {
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
    }
  }
  else {
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
  }
}

async function tickStationedAgent(agent: Model<Agent>, context: ClockContext) {
  const { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards, items } = context
  const station = stations.find((station) => station.dataValues.id === agent.dataValues.stationId)
  if (station) {
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
    }
    else {
      const trainsInStation = trains.filter((train) => station.dataValues.id === train.dataValues.stationId)
      const trainToBoard = trainsInStation[Math.floor(Math.random() * trainsInStation.length)]
      if (trainsInStation.length > 0) {
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
          }
          else {
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
          }
        }
        else {
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
      }
      else {
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
      }
    }
  }
  else {
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
  }
}

async function tickHazards(context: ClockContext) {
  const { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards } = context
  if (Math.random() < 0.05) {
    const hop = hops[Math.floor(Math.random() * hops.length)]
    const distance = Math.floor(Math.random() * hop.dataValues.length)
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
  if (Math.random() < 0.05) {
    const hazard = hazards[Math.floor(Math.random() * hazards.length)]
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

async function tickGameTurn(game: Model<Game>) {
  const gameId = game.dataValues.id
  const gameName = game.dataValues.name
  const turnNumber = game.dataValues.turnNumber
  const lines = await db.models.Line.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const trains = await db.models.Train.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const hops = await db.models.Hop.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const stations = await db.models.Station.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const agents = await db.models.Agent.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const hazards = await db.models.Hazard.findAll({ where: { gameId: { [Op.eq]: gameId } } })
  const items = await db.models.Item.findAll({ where: { gameId: { [Op.eq]: gameId } } })

  const context = { db, gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards, items }

  // Hazard phase
  tickHazards(context)

  // Train phase
  for (let train of trains) {
    // Traveling train
    if (train.dataValues.hopId) {
      await tickTravelingTrain(train, context)
      await train.save()
    }
    // Stationed train
    else if (train.dataValues.stationId) {
      await tickStationedTrain(train, context)
      await train.save()
    }
    // A train is "out-of-bounds" if not hopping or stationed.
    else {
      logger.error({ gameName, turnNumber, trainName: train.dataValues.name }, 'Train is out-of-bounds. Skipping!')
    }
  }

  // Agent phase
  for (let agent of agents) {
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

  // Update age of hazards
  for (let hazard of hazards) {
    hazard.update({ age: hazard.dataValues.age + 1 })
  }

  const destinations = stations.filter((station) => station.dataValues.end)
  const finishedAgents = agents.filter((agent) => destinations.find((s) => agent.dataValues.stationId === s.dataValues.id))
  if (finishedAgents.length > 0) {
    await game.update({ finished: true })
  }

  await game.save()
}

async function tickGame(game: Model<Game>) {
  const gameName = game.dataValues.name
  const gameId = game.dataValues.id
  try {
    await db.transaction(async (t) => {
      // Calculate current turn number
      const previousTurnNumber = game.dataValues.turnNumber || 0
      const turnNumber = previousTurnNumber + 1
      await game.update({ turnNumber })

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

async function tick() {
  logger.info('Ticker starting...')

  // Initialize DB
  await db.sync({ force: false });

  logger.info('Ticker started!...')
  const games: Model<Game>[] = await db.models.Game.findAll({
    where: { finished: false }
  })
  if (parallel) {
    const promises = games.map((game) => tickGame(game))
    await Promise.allSettled(promises)
  }
  else {
    for (let game of games) {
      await tickGame(game)
    }
  }
  logger.info('Ticker finished!')
}

const timeout = (interval: number) => new Promise((res) => setTimeout(res, interval))

async function main() {
  while (true) {
    await tick()
    logger.info('Ticker will tick again in %sms!', tickInterval)
    if (runOnce) {
      break;
    }
    await timeout(tickInterval)
  }
  process.exit()
}

main()