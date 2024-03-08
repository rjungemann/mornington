import dotenv from 'dotenv';
import db, { Agent, Game, Hazard, Hop, Line, Station, Train } from './models';
import { Model, Op, Sequelize } from 'sequelize';
import { logger } from './logging'

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
}

const runOnce: boolean = Boolean( process.env.RUN_ONCE && process.env.RUN_ONCE.toLowerCase() !== 'false' )
const parallel: boolean = Boolean( process.env.PARALLEL && process.env.PARALLEL.toLowerCase() !== 'false' )
const tickInterval: number = parseInt(process.env.TICK_INTERVAL || '5000', 10)

// currentHp
// maxHp 1d6
// armor 1
// strength 3d6
// dexterity 3d6
// willpower 3d6
//
// Skill Check Example
//   you.willpower <= Math.floor(Math.random() * 20.0)
//
// Multiple agents in the same station
// * Roll for initiative
// * Until one or no agents are left:
//   * Each roll for damage (assume 1d6 to start)
//   * If an agent reaches 0 HP, they respawn from a starting point
//   * Agents will not board trains until combat is finished

async function tickTravelingTrain(train: Model<Train>, context: ClockContext) {
  const { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards } = context

  // If a traveling train has no hop, hold position
  const hop = hops.find((hop) => hop.dataValues.id === train.dataValues.hopId)
  if (!hop) {
    logger.warn(
      {
        gameName,
        turnNumber,
        trainName: train.dataValues.name
      },
      'Traveling train has no hop to travel on!',
      train.dataValues.name
    )
    await db.models.Message.create({
      gameId,
      turnNumber,
      message: `Traveling train ${train.dataValues.title} has no hop to travel on!`
    })
    return
  }

  // If there's a hazard, hold position
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
    return
  }

  // If reached end of hop, transfer to station
  if (train.dataValues.distance >= hop.dataValues.length) {
    // Train has reached end of hop
    const station = stations.find((station) => station.dataValues.id === hop.dataValues.tailId)
    if (!station) {
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
      return
    }

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
      return
    }

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
    return
  }

  // If there's a train that'd be overtaken, hold position.
  //
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

    return
  }

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

async function tickStationedTrainInVirtualStation(train: Model<Train>, station: Model<Station>, context: ClockContext) {
  const { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards } = context

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
  if (!hop) {
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
    return
  }

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

async function tickStationedTrainDepartingStation(train: Model<Train>, station: Model<Station>, context: ClockContext) {
  const { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards } = context

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
  if (!hop) {
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
    return
  }

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

async function tickStationedTrain(train: Model<Train>, context: ClockContext) {
  const { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards } = context

  // If stationed train has no station, hold position
  const station = stations.find((station) => station.dataValues.id === train.dataValues.stationId)
  if (!station) {
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
    return
  }

  // If stationed train is in a virtual station, transfer immediately
  if (station.dataValues.virtual) {
    await tickStationedTrainInVirtualStation(train, station, context)
    return
  }

  // If stationed train has waited for its max wait time, it should transfer
  if (train.dataValues.currentWaitTime >= train.dataValues.maxWaitTime) {
    await tickStationedTrainDepartingStation(train, station, context)
    return
  }

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

async function findRandomPath(source: Model<Station>, destination: Model<Station>, context: ClockContext): Promise<Model<Station>[] | undefined> {
  const { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards } = context
  const maxTries = 10
  const maxDepth = 15
  for (let i = 0; i < maxTries; i++) {
    let current: Model<Station> | undefined = source
    let path: Model<Station>[] = []
    while (true) {
      if (!current) {
        break
      }
      if (path.length > maxDepth) {
        break
      }
      path.push(current)
      if (current.dataValues.id === destination.dataValues.id) {
        return path
      }
      const nextHops = hops.filter((hop) => hop.dataValues.headId === current!.dataValues.id)
      const nextHop = nextHops[Math.floor(Math.random() * nextHops.length)]
      if (!nextHop) {
        break
      }
      current = stations
      .filter((station) => !path.some((s) => s.dataValues.id === station.dataValues.id))
      .find((station) => station.dataValues.id === nextHop.dataValues.tailId)
    }
  }
  return
}

async function willTravelingAgentDisembark(agent: Model<Agent>, context: ClockContext) {
  const { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards } = context
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
  const { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards } = context
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

async function tickTravelingAgent(agent: Model<Agent>, context: ClockContext) {
  const { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards } = context

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
  const mightDisembarkTrain = await willTravelingAgentDisembark(agent, context)
  if (!mightDisembarkTrain) {
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
    return
  }

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
}

async function tickStationedAgent(agent: Model<Agent>, context: ClockContext) {
  const { gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards } = context

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
  const trainToBoard = trainsInStation[Math.floor(Math.random() * trainsInStation.length)]
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
  if (!mightBoardTrain) {
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
    return
  }

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

  const context = { db, gameId, gameName, turnNumber, lines, trains, hops, stations, agents, hazards }

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
      const newGame = await db.models.Game.findOne({
        include: [
          { model: db.models.Station, as: 'stations' },
          { model: db.models.Line, as: 'lines' },
          { model: db.models.Hop, as: 'hops' },
          { model: db.models.Train, as: 'trains' },
          { model: db.models.Agent, as: 'agents' },
          { model: db.models.Hazard, as: 'hazards' },
        ],
        where: { name: gameName }
      })
      // Store pre-digested game turn data
      await db.models.GameTurn.create({
        gameId,
        turnNumber,
        data: newGame
      })
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
  
  if (true) {
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