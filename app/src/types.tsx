type StationResponse = {
  id: number
  name: string
  title: string
  label: string
  virtual: boolean
  start: boolean
  end: boolean
  x: number
  y: number
}

type LineResponse = {
  id: number
  name: string
  title: string
  label: string
  color: string
}

type HopResponse = {
  id: number
  label: string
  length: number
  headId: number
  tailId: number
  lineId: number
}

type TrainResponse = {
  id: number
  name: string
  title: string
  label: string
  color: string
  distance: number
  speed: number
  maxWaitTime: number,
  currentWaitTime: number,
  stationId: number
  hopId: number
  lineId: number
}

type AgentResponse = {
  id: number
  name: string
  title: string
  label: string
  stationId: number
  trainId: number
}

type GameResponse = {
  stations: StationResponse[]
  lines: LineResponse[]
  hops: HopResponse[]
  trains: TrainResponse[]
  agents: AgentResponse[]
}

type MetadataResponse = {
  name: string,
  title: string,
  label: string
}

type Position = {
  x: number
  y: number
}

type GraphOptions = {
  hopStrokeWidth: number,
  stationStroke: string,
  stationStrokeWidth: number,
  stationFill: string,
  stationRadius: number,
  virtualStationRadius: number,
  sourceRadius: number,
  sourceStroke: string,
  sourceStrokeWidth: number,
  destinationRadius: number,
  destinationStroke: string,
  destinationStrokeWidth: number,
  trainRadius: number,
  offset: Position,
  size: Position
}