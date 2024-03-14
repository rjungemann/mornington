import dotenv from 'dotenv'
import db from '../models'
import { readFile } from 'fs/promises';
import * as yargs from 'yargs'
import xml2js from 'xml2js'
import destroyGameByName from './destroyGameByName';
import { logger } from '../logging';
import { Sequelize } from 'sequelize';
import createGameTurn from './createGameTurn';

type Args = {
  file: string
}

type ResultItem = {
  svg: {
    g: LayerItem[]
  }
}

type LayerItem = {
  ['$']: {
    ['inkscape:label']: string
  }
  path: any[]
  circle: any[]
  rect: any[]
}

type GameItem = {
  ['$']: {
    ['inkscape:label']: string
    title: string
    label: string
    description: string
    currentSeed: string
    startingSeed: string
    startTime: string;
    currentTime: string;
    turnDurationSeconds: string;
    weatherName: string;
    weatherTitle: string;
    weatherLabel: string;
    moonPhaseName: string;
    moonPhaseTitle: string;
    moonPhaseLabel: string;
  }
}

type GameTransformed = {
  name: string
  title: string
  label: string
  description: string
  currentSeed: number
  startingSeed: number
  startTime: Date;
  currentTime: Date;
  turnDurationSeconds: Number;
  weatherName: string;
  weatherTitle: string;
  weatherLabel: string;
  moonPhaseName: string;
  moonPhaseTitle: string;
  moonPhaseLabel: string;
}

type AgentItem = {
  ['$']: {
    ['inkscape:label']: string
    title: string
    label: string
    description: string
    strength: string
    dexterity: string
    willpower: string
    currentHp: string
    maxHp: string
    initiative: string
    timeout: string
    stunTimeout: string
    birthdate: string
    stationName: string
    trainName: string
    style: string
  }
}

type AgentTransformed = {
  name: string
  title: string
  label: string
  description: string
  color: string
  strength: number
  dexterity: number
  willpower: number
  currentHp: number
  maxHp: number
  initiative: number
  timeout: number
  stunTimeout: number
  birthdate: Date
  stationName: string | null
  trainName: string | null
}

type TrainItem = {
  ['$']: {
    ['inkscape:label']: string
    title: string
    label: string
    line: string
    stationName: string
    hopName: string
    style: string
    distance: string
    speed: string
    currentWaitTime: string
    maxWaitTime: string
  }
}

type TrainTransformed = {
  name: string
  title: string
  label: string
  color: string
  lineName: string
  stationName: string | null
  hopName: string | null
  distance: number
  speed: number
  currentWaitTime: number
  maxWaitTime: number
}

type StationItem = {
  ['$']: {
    ['inkscape:label']: string,
    title: string,
    label: string,
    start: string,
    end: string,
    virtual: string,
    cx: string,
    cy: string
  }
}

type StationTransformed = {
  name: string
  title: string
  label: string
  start: boolean
  end: boolean
  virtual: boolean
  x: number
  y: number
}

type HopItem = {
  ['$']: {
    ['inkscape:label']: string
    label: string
    line: string
    length: string
    switchGroups: string
    active: string
  }
}

type HopTransformed = {
  name: string
  label: string
  length: number
  switchGroups: string[]
  active: boolean
  lineName: string
  headName: string
  tailName: string
}

type LineItem = {
  ['$']: {
    ['inkscape:label']: string
    title: string
    label: string
    kind: string
    style: string
  }
}

type LineTransformed = {
  name: string
  title: string
  label: string
  color: string
}

type HazardItem = {
  ['$']: {
    ['inkscape:label']: string
    title: string
    label: string
    kind: string
    distance: string
    age: string
    style: string
    hopName: string
  }
}

type HazardTransformed = {
  name: string
  title: string
  label: string
  kind: string
  age: number
  distance: number
  color: string
  hopName: string
}

type ItemItem = {
  ['$']: {
    ['inkscape:label']: string
    title: string
    label: string
    kind: string
    damage: string
    agentName: string
  }
}

type ItemTransformed = {
  name: string
  title: string
  label: string
  kind: string
  damage: string
  agentName: string
}

dotenv.config();

const parseXml = (data: string): Promise<ResultItem> => new Promise((res, rej) => {
  const parser = new xml2js.Parser();
  parser.parseString(data, function (err, result) {
    err ? rej(err) : res(result as ResultItem)
  });
})

const getLayer = (result: ResultItem, layerName: string) => {
  const layers = result.svg.g as LayerItem[]
  return layers.find((g: LayerItem) => g.$['inkscape:label'] === layerName) as LayerItem
}

const parseGame = (result: ResultItem): GameTransformed => {
  const layer = getLayer(result, 'Game')
  const game = layer.rect[0]
  const name = game.$['inkscape:label']
  const title = game.$.title
  const label = game.$.label
  const description = game.$.description
  const startingSeed = parseFloat(game.$.startingSeed)
  const currentSeed = parseFloat(game.$.currentSeed)
  const startTime = new Date(game.$.startTime)
  const currentTime = new Date(game.$.currentTime)
  const turnDurationSeconds = parseInt(game.$.turnDurationSeconds, 10)
  const weatherName = game.$.weatherName
  const weatherLabel = game.$.weatherLabel
  const weatherTitle = game.$.weatherTitle
  const moonPhaseName = game.$.moonPhaseName
  const moonPhaseLabel = game.$.moonPhaseLabel
  const moonPhaseTitle = game.$.moonPhaseTitle
  return { name, title, label, description, startingSeed, currentSeed, startTime, currentTime, turnDurationSeconds, weatherName, weatherLabel, weatherTitle, moonPhaseName, moonPhaseLabel, moonPhaseTitle }
}

const parseAgents = (result: ResultItem): AgentTransformed[] => {
  const layer = getLayer(result, 'Agents')
  const agents = layer.circle.map((agent: AgentItem): AgentTransformed => {
    const name = agent.$['inkscape:label']
    const title = agent.$.title
    const label = agent.$.label
    const description = agent.$.description
    const color = agent.$.style.match(/fill:\s*(#[^;]*)/)![1]
    const strength = parseInt(agent.$.strength, 10)
    const dexterity = parseInt(agent.$.dexterity, 10)
    const willpower = parseInt(agent.$.willpower, 10)
    const currentHp = parseInt(agent.$.currentHp, 10)
    const maxHp = parseInt(agent.$.maxHp, 10)
    const initiative = parseInt(agent.$.initiative, 10)
    const timeout = parseInt(agent.$.timeout, 10)
    const stunTimeout = parseInt(agent.$.stunTimeout, 10)
    const birthdate = new Date(agent.$.birthdate)
    const stationName = agent.$.stationName === 'null' ? null : agent.$.stationName
    const trainName = agent.$.trainName === 'null' ? null : agent.$.trainName
    return { name, title, label, description, color, strength, dexterity, willpower, currentHp, maxHp, initiative, timeout, stunTimeout, birthdate, stationName, trainName }
  })
  return agents
}

const parseTrains = (result: ResultItem): TrainTransformed[] => {
  const layer = getLayer(result, 'Trains')
  const trains = layer.rect.map((train: TrainItem) => {
    const name = train.$['inkscape:label']
    const title = train.$.title
    const label = train.$.label
    const color = train.$.style.match(/fill:\s*(#[^;]*)/)![1]
    const lineName = train.$.line
    const stationName = train.$.stationName === 'null' ? null : train.$.stationName
    const hopName = train.$.hopName === 'null' ? null : train.$.hopName
    const distance = parseInt(train.$.distance, 10)
    const speed = parseInt(train.$.speed, 10)
    const currentWaitTime = parseInt(train.$.currentWaitTime, 10)
    const maxWaitTime = parseInt(train.$.maxWaitTime, 10)
    return { name, title, label, color, stationName, hopName, lineName, distance, speed, currentWaitTime, maxWaitTime }
  })
  return trains
}

const parseStations = (result: ResultItem): StationTransformed[] => {
  const layer = getLayer(result, 'Stations')
  const stations = layer.circle.map((station: StationItem) => {
    const name = station.$['inkscape:label']
    const title = station.$.title
    const label = station.$.label
    const start = station.$.start === 'true' ? true : false
    const end = station.$.end === 'true' ? true : false
    const virtual = station.$.virtual === 'true' ? true : false
    const x = parseInt(station.$.cx, 10)
    const y = parseInt(station.$.cy, 10)
    return { name, title, label, start, end, virtual, x, y }
  })
  return stations
}

const parseHops = (result: ResultItem): HopTransformed[] => {
  const layer = getLayer(result, 'Hops')
  const hops = layer.path.map((hop: HopItem) => {
    const name = hop.$['inkscape:label']
    const label = hop.$.label
    const length = parseInt(hop.$.length, 10)
    const switchGroups = hop.$.switchGroups.split(/\s+/).map((s) => s.trim()).filter((s) => s.length)
    const active = hop.$.active === 'true' ? true : false
    const [headName, tailName] = name.split(':')
    const lineName = hop.$.line
    return { name, length, label, switchGroups, active, headName, tailName, lineName }
  })
  return hops
}

const parseLines = (result: ResultItem): LineTransformed[] => {
  const layer = getLayer(result, 'Lines')
  const lines = layer.rect.map((line: LineItem) => {
    const name = line.$['inkscape:label']
    const title = line.$.title
    const label = line.$.label
    const color = line.$.style.match(/fill:\s*(#[^;]*)/)![1]
    return { name, title, label, color }
  })
  return lines
}

const parseHazards = (result: ResultItem): HazardTransformed[] => {
  const layer = getLayer(result, 'Hazards')
  if (!layer.circle) {
    return []
  }
  const hazards = layer.circle.map((hazard: HazardItem) => {
    const name = hazard.$['inkscape:label']
    const title = hazard.$.title
    const label = hazard.$.label
    const kind = hazard.$.kind
    const hopName = hazard.$.hopName
    const age = parseInt(hazard.$.age, 10)
    const distance = parseInt(hazard.$.distance, 10)
    const color = hazard.$.style.match(/fill:\s*(#[^;]*)/)![1]
    return { name, title, label, kind, age, distance, color, hopName }
  })
  return hazards
}

const parseItems = (result: ResultItem): ItemTransformed[] => {
  const layer = getLayer(result, 'Items')
  if (!layer.circle) {
    return []
  }
  const items = layer.circle.map((item: ItemItem) => {
    const name = item.$['inkscape:label']
    const title = item.$.title
    const label = item.$.label
    const kind = item.$.kind
    const damage = item.$.damage
    const agentName = item.$.agentName
    return { name, title, label, kind, damage, agentName }
  })
  return items
}

const importGameFromSvg = (db: Sequelize) => async (path: string) => {
  const data = (await readFile(path)).toLocaleString()
  const result = await parseXml(data);

  const gameData = parseGame(result)
  const agentsData = parseAgents(result)
  const trainsData = parseTrains(result)
  const stationsData = parseStations(result)
  const hopsData = parseHops(result)
  const linesData = parseLines(result)
  const hazardsData = parseHazards(result)
  const itemsData = parseItems(result)

  // Remove existing game first
  logger.warn({ gameName: gameData.name }, 'Destroying existing games with same name')
  await destroyGameByName(db)(gameData.name)

  logger.info({ gameName: gameData.name }, 'Importing game')
  const game = await db.models.Game.create({ ...gameData, turnNumber: 0, finished: false })
  const stations = await db.models.Station
  .bulkCreate(stationsData.map((station) => ({ ...station, gameId: game.dataValues.id })))
  const lines = await db.models.Line
  .bulkCreate(linesData.map((line) => ({ ...line, gameId: game.dataValues.id })))
  const hops = await db.models.Hop
  .bulkCreate(hopsData.map((hop) => {
    const headStation = stations.find((station) => station.dataValues.name === hop.headName)!
    const tailStation = stations.find((station) => station.dataValues.name === hop.tailName)!
    const line = lines.find((line) => line.dataValues.name === hop.lineName)!
    const { headName, tailName, ...basicHop } = hop
    return {
      ...basicHop,
      headId: headStation.dataValues.id,
      tailId: tailStation.dataValues.id,
      lineId: line.dataValues.id,
      gameId: game.dataValues.id
    }
  }))
  const trains = await db.models.Train
  .bulkCreate(trainsData.map((train) => {
    const station = stations.find((station) => station.dataValues.name === train.stationName)
    const hop = hops.find((hop) => hop.dataValues.name === train.hopName)
    const line = lines.find((line) => line.dataValues.name === train.lineName)!
    const { hopName, stationName, lineName, ...basicTrain } = train
    return {
      ...basicTrain,
      gameId: game.dataValues.id,
      stationId: station?.dataValues.id,
      hopId: hop?.dataValues.id,
      lineId: line.dataValues.id
    }
  }))
  const agents = await db.models.Agent
  .bulkCreate(agentsData.map((agent) => {
    const startingStations = stations.filter((station) => station.dataValues.start)
    const startingStation = startingStations[Math.floor(Math.random() * startingStations.length)]!
    const { stationName, trainName, ...basicAgent } = agent
    return {
      ...basicAgent,
      gameId: game.dataValues.id,
      stationId: startingStation.dataValues.id,
      trainId: null
    }
  }))
  const hazards = await db.models.Hazard
  .bulkCreate(hazardsData.map((hazard) => {
    const hop = hops.find((hop) => hop.dataValues.name === hazard.hopName)
    const { hopName, ...basicHazard } = hazard
    return {
      ...basicHazard,
      hopId: hop!.dataValues.id,
      gameId: game.dataValues.id
    }
  }))
  const items = await db.models.Item
  .bulkCreate(itemsData.map((item) => {
    const agent = agents.find((agent) => agent.dataValues.name === item.agentName)
    const { agentName, ...basicItem } = item
    return {
      ...item,
      agentId: agent?.dataValues.id,
      gameId: game.dataValues.id
    }
  }))

  await createGameTurn(db)(gameData.name)
}

export default importGameFromSvg