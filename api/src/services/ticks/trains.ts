import db, { Train } from '../../models';
import { Model } from 'sequelize';
import { logger } from '../../logging'
import { ClockContext } from '../../types';
import { gameSeededRandom } from '.././ticks/shared';

async function tickTravelingTrain(train: Model<Train>, context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards, items } = context
  const { id: gameId, name: gameName, turnNumber } = game.dataValues
  const hop = hops.find((hop) => hop.dataValues.id === train.dataValues.hopId)
  if (!hop) {
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
    return
  }

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

async function tickStationedTrain(train: Model<Train>, context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards, items } = context
  const { id: gameId, name: gameName, turnNumber } = game.dataValues

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
    const hop = nextHops[Math.floor(gameSeededRandom(game) * nextHops.length)]
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
    return
  }

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
    const hop = nextHops[Math.floor(gameSeededRandom(game) * nextHops.length)]
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

async function tickTrains(context: ClockContext) {
  const { game, lines, trains, hops, stations, agents, hazards, items } = context
  const { id: gameId, name: gameName, turnNumber } = game.dataValues

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
}

export { tickTrains }