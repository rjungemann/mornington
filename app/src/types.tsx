type GameListItemResponse = {
  id: number
  name: string
  title: string
  label: string
  turnNumber: number
  finished: boolean
  createdAt: string
  updatedAt: string
  agents: AgentResponse[]
}

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
  color: string
  strength: number
  dexterity: number
  willpower: number
  currentHp: number
  maxHp: number
  initiative: number
  timeout: number
  stunTimeout: number
  stationId: number
  trainId: number
}

type HazardResponse = {
  id: number
  name: string
  title: string
  label: string
  color: string
  kind: string
  distance: number
  age: number
  hopId: number
}

type ItemResponse = {
  id: number
  name: string
  title: string
  label: string
  kind: string
  damage: string
  agentId: number
}

type GameTurnResponse = {
  stations: StationResponse[]
  lines: LineResponse[]
  hops: HopResponse[]
  trains: TrainResponse[]
  agents: AgentResponse[]
  hazards: HazardResponse[]
  items: ItemResponse[]
  createdAt: string
  updatedAt: string
}

type GameResponse = {
  name: string
  title: string
  label: string
  turnNumber: number
  finished: boolean
  createdAt: string
  updatedAt: string
}

type MessageResponse = {
  id: number
  turnNumber: number
  message: string
  gameId: number
  createdAt: string
  updatedAt: string
}

type MessagesResponse = MessageResponse[]

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

type GameContextData = {
  game: GameResponse
  gameTurn: GameTurnResponse
  messages: MessageResponse[]
}