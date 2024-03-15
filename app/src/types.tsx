type GameResponse = {
  id: number
  name: string
  title: string
  label: string
  description: string
  turnNumber: number
  finished: boolean
  startingSeed: number
  currentSeed: number
  startTime: string
  currentTime: string
  turnDurationSeconds: number
  weatherName: string
  weatherTitle: string
  weatherLabel: string
  moonPhaseName: string
  moonPhaseTitle: string
  moonPhaseLabel: string
  createdAt: string
  updatedAt: string
}

type GameTurnResponse = GameResponse & {
  stations: StationResponse[]
  lines: LineResponse[]
  hops: HopResponse[]
  trains: TrainResponse[]
  agents: AgentResponse[]
  hazards: HazardResponse[]
  items: ItemResponse[]
}

type GameListItemResponse = GameResponse & {
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
  length: number
  switchGroups: string[]
  active: any
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

type MessageResponse = {
  id: number
  turnNumber: number
  currentTime: string
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
  fontFamily: string,
  hopStrokeWidth: number, // Must be a number, because we do math on it
  stationStroke: string,
  stationStrokeWidth: number | string,
  stationFill: string,
  stationRadius: number,
  virtualStationRadius: number,
  sourceRadius: number,
  sourceStroke: string,
  sourceStrokeWidth: number,
  destinationRadius: number,
  destinationStroke: string,
  destinationStrokeWidth: number | string,
  trainRadius: number,
  offset: Position,
  size: Position,

  dropShadowStyle: { filter: string }

  bubbleOffsetY: number
  bubbleOffsetX: number
  bubbleHeight: number
  bubbleStroke: string
  bubbleFill: string
  bubbleStrokeWidth: number | string
  bubbleRadius: number
  bubbleAgentRadius: number
  bubbleAgentPadding: number
  bubbleTipWidth: number
  bubbleTipHeight: number

  traversalStroke: string
  traversalStrokeWidth: number | string
  traversalOpacity: number
  traversalMagnitude: number

  hazardStroke: string
  hazardStrokeWidth: number | string
  hazardScale: number

  trainScale: number
  trainStroke: string
  trainStrokeWidth: number | string

  stationTextOffsetY: number
  stationTextColor: string
  stationFontSize: string
  stationSourceOpacity: number
  stationDestinationOpacity: number
}

type GameContextData = {
  game: GameResponse
  gameTurn: GameTurnResponse
  games: GameListItemResponse[]
  messages: MessageResponse[]
}