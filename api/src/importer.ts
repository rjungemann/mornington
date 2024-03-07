import dotenv from 'dotenv'
import db from './models'
import { readFile } from 'fs/promises';
import * as yargs from 'yargs'
import xml2js from 'xml2js'

type Args = {
  file: string
  name: string
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
  }
}

type GameTransformed = {
  name: string
  title: string
  label: string
}

type AgentItem = {
  ['$']: {
    ['inkscape:label']: string
    title: string
    label: string
    stationName: string
    trainName: string
    style: string
  }
}

type AgentTransformed = {
  name: string
  title: string
  label: string
  color: string
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
  }
}

type HopTransformed = {
  name: string
  label: string
  length: number
  lineName: string
  headName: string
  tailName: string
}

type LineItem = {
  ['$']: {
    ['inkscape:label']: string
    title: string
    label: string
    style: string
  }
}

type LineTransformed = {
  name: string
  title: string
  label: string
  color: string
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
  return { name, title, label }
}

const parseAgents = (result: ResultItem): AgentTransformed[] => {
  const layer = getLayer(result, 'Agents')
  const agents = layer.circle.map((agent: AgentItem): AgentTransformed => {
    const name = agent.$['inkscape:label']
    const title = agent.$.title
    const label = agent.$.label
    const color = agent.$.style.match(/fill:\s*(#[^;]*)/)![1]
    const stationName = agent.$.stationName === 'null' ? null : agent.$.stationName
    const trainName = agent.$.trainName === 'null' ? null : agent.$.trainName
    return { name, title, label, color, stationName, trainName }
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
    const [headName, tailName] = name.split(':')
    const lineName = hop.$.line
    return { name, length, label, headName, tailName, lineName }
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

async function main() {
  console.info('Importer starting...')

  // Initialize DB
  await db.sync({ force: false });

  const args: Args = yargs
  .option('file', {
      alias: 'f',
      description: 'Map file to import',
      demandOption: true
  })
  .option('name', {
    alias: 'n',
    description: 'Name of game to create',
    demandOption: true
  })
  .argv as Args;

  const { file, name } = args
  const data = (await readFile(args.file)).toLocaleString()
  const result = await parseXml(data);

  const gameData = parseGame(result)
  const agentsData = parseAgents(result)
  const trainsData = parseTrains(result)
  const stationsData = parseStations(result)
  const hopsData = parseHops(result)
  const linesData = parseLines(result)

  await db.transaction(async (t) => {
    const game = await db.models.Game.create({ ...gameData, turnNumber: 0 })
    const stations = await db.models.Station
    .bulkCreate(stationsData.map((station) => ({ ...station, gameId: game.dataValues.id })))
    const lines = await db.models.Line
    .bulkCreate(linesData.map((line) => ({ ...line, gameId: game.dataValues.id })))
    const hops = await db.models.Hop
    .bulkCreate(hopsData.map((hop) => {
      const headStation = stations.find((station) => station.dataValues.name === hop.headName)!
      const tailStation = stations.find((station) => station.dataValues.name === hop.tailName)!
      const line = lines.find((line) => line.dataValues.name === hop.lineName)!
      return {
        name: hop.name,
        label: hop.label,
        length: hop.length,
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
      return {
        name: train.name,
        title: train.title,
        label: train.label,
        color: train.color,
        distance: train.distance,
        speed: train.speed,
        currentWaitTime: train.currentWaitTime,
        maxWaitTime: train.maxWaitTime,
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
      return {
        name: agent.name,
        title: agent.title,
        label: agent.label,
        color: agent.color,
        gameId: game.dataValues.id,
        stationId: startingStation.dataValues.id,
        trainId: null
      }
    }))
  })

  process.exit()
}

main()