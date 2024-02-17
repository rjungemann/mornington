type StationResponse = {
  id: number
  name: string
  title: string
  label: string
  x: number
  y: number
}

type HopResponse = {
  id: number
  label: string
  length: number
  headId: number
  tailId: number
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
  hops: HopResponse[]
  trains: TrainResponse[]
  agents: AgentResponse[]
}

type Position = {
  x: number
  y: number
}

type GraphOptions = {
  hopStroke: string,
  hopStrokeWidth: number,
  stationFill: string,
  stationRadius: number,
  trainFill: string,
  trainRadius: number,
  offset: Position,
  size: Position
}