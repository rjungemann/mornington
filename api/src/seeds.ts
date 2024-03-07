// ---------
// Factories
// ---------

import { Sequelize } from "sequelize";
import sequelize from "./models";

export async function seed(db: Sequelize) {
  await db.transaction(async (t) => {
    // --------
    // Truncate
    // --------

    await sequelize.query(`truncate games, "gameTurns", stations, lines, hops, trains, agents, messages`);

    // ----
    // Game
    // ----

    const game = await db.models.Game.create({
      name: 'one',
      title: 'Game #1',
      label: 'Game #1',
      turnNumber: 0,
      finished: false
    })

    // --------
    // Stations
    // --------

    const [ox, oy] = [100, 50]

    const stationZ = await db.models.Station.create({
      name: 'z',
      title: 'Z',
      label: 'Z',
      virtual: true,
      start: false,
      end: false,
      x: ox + 150,
      y: oy + 50,
      gameId: game.dataValues.id
    })
    const stationX = await db.models.Station.create({
      name: 'x',
      title: 'X',
      label: 'X',
      virtual: true,
      start: false,
      end: false,
      x: ox + 150,
      y: oy + 250,
      gameId: game.dataValues.id
    })
    const stationA = await db.models.Station.create({
      name: 'a',
      title: 'Greedon Way',
      label: 'A',
      virtual: false,
      start: true,
      end: false,
      x: ox + 10,
      y: oy + 175,
      gameId: game.dataValues.id
    })
    const stationB = await db.models.Station.create({
      name: 'b',
      title: 'Wofford Moor',
      label: 'B',
      virtual: false,
      start: false,
      end: false,
      x: ox + 70,
      y: oy + 150,
      gameId: game.dataValues.id
    })
    const stationC = await db.models.Station.create({
      name: 'c',
      title: 'Grunham Vale',
      label: 'C',
      virtual: false,
      start: false,
      end: false,
      x: ox + 110,
      y: oy + 50,
      gameId: game.dataValues.id
    })
    const stationD = await db.models.Station.create({
      name: 'd',
      title: 'Diplo East',
      label: 'D',
      virtual: false,
      start: false,
      end: false,
      x: ox + 190,
      y: oy + 50,
      gameId: game.dataValues.id
    })
    const stationE = await db.models.Station.create({
      name: 'e',
      title: 'Minstowe North',
      label: 'E',
      virtual: false,
      start: false,
      end: false,
      x: ox + 110,
      y: oy + 250,
      gameId: game.dataValues.id
    })
    const stationF = await db.models.Station.create({
      name: 'f',
      title: 'Badgers Mare',
      label: 'F',
      virtual: false,
      x: ox + 190,
      y: oy + 250,
      gameId: game.dataValues.id
    })
    const stationG = await db.models.Station.create({
      name: 'g',
      title: 'Cowstone East',
      label: 'G',
      virtual: false,
      start: false,
      end: false,
      x: ox + 230,
      y: oy + 150,
      gameId: game.dataValues.id
    })
    const stationH = await db.models.Station.create({
      name: 'h',
      title: 'Lefting Cross',
      label: 'H',
      virtual: false,
      start: false,
      end: true,
      x: ox + 290,
      y: oy + 175,
      gameId: game.dataValues.id
    })
    const stationI = await db.models.Station.create({
      name: 'i',
      title: 'Fayre Holt',
      label: 'I',
      virtual: false,
      start: false,
      end: false,
      x: ox + 230,
      y: oy + 350,
      gameId: game.dataValues.id
    })
    const stationJ = await db.models.Station.create({
      name: 'j',
      title: 'Rivermouth Mount',
      label: 'J',
      virtual: false,
      start: false,
      end: false,
      x: ox + 70,
      y: oy + 350,
      gameId: game.dataValues.id
    })

    // -----
    // Lines
    // -----

    const lineBlue = await db.models.Line.create({
      name: 'blue',
      title: 'Blue Line',
      label: 'Blue',
      color: '#1d4ed8',
      gameId: game.dataValues.id
    })
    const lineRed = await db.models.Line.create({
      name: 'red',
      title: 'Red Line',
      label: 'Red',
      color: '#b91c1c',
      gameId: game.dataValues.id
    })

    // ----
    // Hops
    // ----

    // Blue Line

    const hopBlueFromAToB = await db.models.Hop.create({
      name: 'a:b',
      label: 'Hop from A to B',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationA.dataValues.id,
      tailId: stationB.dataValues.id,
      lineId: lineBlue.dataValues.id
    })
    const hopBlueFromBToC = await db.models.Hop.create({
      name: 'b:c',
      label: 'Hop from B to C',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationB.dataValues.id,
      tailId: stationC.dataValues.id,
      lineId: lineBlue.dataValues.id
    })
    const hopBlueFromBToE = await db.models.Hop.create({
      name: 'b:e',
      label: 'Hop from B to E',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationB.dataValues.id,
      tailId: stationE.dataValues.id,
      lineId: lineBlue.dataValues.id
    })
    const hopBlueFromCToZ = await db.models.Hop.create({
      name: 'c:z',
      label: 'Hop from C to Z',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationC.dataValues.id,
      tailId: stationZ.dataValues.id,
      lineId: lineBlue.dataValues.id
    })
    const hopBlueFromZToD = await db.models.Hop.create({
      name: 'z:d',
      label: 'Hop from Z to D',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationZ.dataValues.id,
      tailId: stationD.dataValues.id,
      lineId: lineBlue.dataValues.id
    })
    const hopBlueFromEToX = await db.models.Hop.create({
      name: 'e:x',
      label: 'Hop from E to X',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationE.dataValues.id,
      tailId: stationX.dataValues.id,
      lineId: lineBlue.dataValues.id
    })
    const hopBlueFromXToF = await db.models.Hop.create({
      name: 'x:f',
      label: 'Hop from X to F',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationX.dataValues.id,
      tailId: stationF.dataValues.id,
      lineId: lineBlue.dataValues.id
    })
    const hopBlueFromDToG = await db.models.Hop.create({
      name: 'd:g',
      label: 'Hop from D to G',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationD.dataValues.id,
      tailId: stationG.dataValues.id,
      lineId: lineBlue.dataValues.id
    })
    const hopBlueFromFToG = await db.models.Hop.create({
      name: 'f:g',
      label: 'Hop from F to G',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationF.dataValues.id,
      tailId: stationG.dataValues.id,
      lineId: lineBlue.dataValues.id
    })
    const hopBlueFromGToH = await db.models.Hop.create({
      name: 'g:h',
      label: 'Hop from G to H',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationG.dataValues.id,
      tailId: stationH.dataValues.id,
      lineId: lineBlue.dataValues.id
    })
    const hopBlueFromHToI = await db.models.Hop.create({
      name: 'h:i',
      label: 'Hop from H to I',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationH.dataValues.id,
      tailId: stationI.dataValues.id,
      lineId: lineBlue.dataValues.id
    })
    const hopBlueFromIToJ = await db.models.Hop.create({
      name: 'i:j',
      label: 'Hop from I to J',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationI.dataValues.id,
      tailId: stationJ.dataValues.id,
      lineId: lineBlue.dataValues.id
    })
    const hopBlueFromJToA = await db.models.Hop.create({
      name: 'j:a',
      label: 'Hop from J to A',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationJ.dataValues.id,
      tailId: stationA.dataValues.id,
      lineId: lineBlue.dataValues.id
    })

    // Red Line

    const hopRedFromBToC = await db.models.Hop.create({
      name: 'b:c',
      label: 'Hop from B to C',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationB.dataValues.id,
      tailId: stationC.dataValues.id,
      lineId: lineRed.dataValues.id
    })
    const hopRedFromCToZ = await db.models.Hop.create({
      name: 'c:z',
      label: 'Hop from C to Z',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationC.dataValues.id,
      tailId: stationZ.dataValues.id,
      lineId: lineRed.dataValues.id
    })
    const hopRedFromZToD = await db.models.Hop.create({
      name: 'z:d',
      label: 'Hop from Z to D',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationZ.dataValues.id,
      tailId: stationD.dataValues.id,
      lineId: lineRed.dataValues.id
    })
    const hopRedFromDToG = await db.models.Hop.create({
      name: 'd:g',
      label: 'Hop from D to G',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationD.dataValues.id,
      tailId: stationG.dataValues.id,
      lineId: lineRed.dataValues.id
    })
    const hopRedFromGToF = await db.models.Hop.create({
      name: 'g:f',
      label: 'Hop from G to F',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationG.dataValues.id,
      tailId: stationF.dataValues.id,
      lineId: lineRed.dataValues.id
    })
    const hopRedFromFToX = await db.models.Hop.create({
      name: 'f:x',
      label: 'Hop from F to X',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationF.dataValues.id,
      tailId: stationX.dataValues.id,
      lineId: lineRed.dataValues.id
    })
    const hopRedFromXToE = await db.models.Hop.create({
      name: 'x:e',
      label: 'Hop from X to E',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationX.dataValues.id,
      tailId: stationE.dataValues.id,
      lineId: lineRed.dataValues.id
    })
    const hopRedFromEToB = await db.models.Hop.create({
      name: 'e:b',
      label: 'Hop from E to B',
      length: 3,
      gameId: game.dataValues.id,
      headId: stationE.dataValues.id,
      tailId: stationB.dataValues.id,
      lineId: lineRed.dataValues.id
    })

    // ------
    // Trains
    // ------

    // Blue trains

    const trainBlue1 = await db.models.Train.create({
      name: 'blue:1',
      title: 'Blue #1',
      label: 'Example Train #1',
      color: '#60a5fa',
      distance: 0,
      speed: 1,
      maxWaitTime: 3,
      currentWaitTime: 0,
      gameId: game.dataValues.id,
      stationId: stationC.dataValues.id,
      hopId: null,
      lineId: lineBlue.dataValues.id
    })
    const trainBlue2 = await db.models.Train.create({
      name: 'blue:2',
      title: 'Blue #2',
      label: 'Example Train #2',
      color: '#60a5fa',
      distance: 0,
      speed: 1,
      maxWaitTime: 3,
      currentWaitTime: 0,
      gameId: game.dataValues.id,
      stationId: stationD.dataValues.id,
      hopId: null,
      lineId: lineBlue.dataValues.id
    })
    const trainBlue3 = await db.models.Train.create({
      name: 'blue:3',
      title: 'Blue #3',
      label: 'Example Train #3',
      color: '#60a5fa',
      distance: 0,
      speed: 1,
      maxWaitTime: 3,
      currentWaitTime: 0,
      gameId: game.dataValues.id,
      stationId: null,
      hopId: hopBlueFromHToI.dataValues.id,
      lineId: lineBlue.dataValues.id
    })

    // Red trains

    const trainRed1 = await db.models.Train.create({
      name: 'red:1',
      title: 'Red #1',
      label: 'Example Train #4',
      color: '#f87171',
      distance: 0,
      speed: 1,
      maxWaitTime: 3,
      currentWaitTime: 0,
      gameId: game.dataValues.id,
      stationId: stationD.dataValues.id,
      hopId: null,
      lineId: lineRed.dataValues.id
    })

    // ------
    // Agents
    // ------

    const agent1 = await db.models.Agent.create({
      name: 'alice',
      title: 'Alice',
      label: 'Started on a train',
      color: '#3366cc',
      gameId: game.dataValues.id,
      stationId: null,
      trainId: trainBlue1.dataValues.id,
    })
    const agent2 = await db.models.Agent.create({
      name: 'bob',
      title: 'Bob',
      label: 'Started in a station',
      color: '#99cc33',
      gameId: game.dataValues.id,
      stationId: stationI.dataValues.id,
      trainId: null,
    })
    const agent3 = await db.models.Agent.create({
      name: 'eve',
      title: 'Eve',
      label: 'Started in a station',
      color: '#ff9900',
      gameId: game.dataValues.id,
      stationId: stationJ.dataValues.id,
      trainId: null
    })
  })
}
