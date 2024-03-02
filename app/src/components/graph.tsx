'use client';

// const dropShadowStyle = { filter: 'drop-shadow(0px 4px 2px rgb(0 0 0 / 0.4))' }
const dropShadowStyle = {}

const lerp = (a: number, b: number, t: number) => ((1 - t) * a + t * b);
const getGameHopHeadAndTail = (game: GameResponse, hop: HopResponse): [StationResponse, StationResponse] => {
  const head = game!.stations.find((station) => station.id === hop.headId)!
  const tail = game!.stations.find((station) => station.id === hop.tailId)!
  return [head, tail]
}

const getGameHopRelativePosition = (game: GameResponse, hop: HopResponse, percent: number): Position => {
  const [head, tail] = getGameHopHeadAndTail(game, hop)
  const x = lerp(head.x, tail.x, percent)
  const y = lerp(head.y, tail.y, percent)
  return { x, y }
}

function angleBetween(x1: number, y1: number, x2: number, y2: number) {
  return Math.atan2(y2 - y1, x2 - x1)
}

function projectPoint(x: number, y: number, angle: number, magnitude: number): [number, number] {
  return [x + Math.cos(angle) * magnitude, y + Math.sin(angle) * magnitude]
}

const Hops = ({ game, options }: { game: GameResponse, options: GraphOptions }) => {
  const hopToKey = (hop: HopResponse) => `${[hop.headId, hop.tailId].sort().join(':')}`
  let keysToHops: Record<string, HopResponse[]> = {}
  for (let hop of game.hops) {
    const key = hopToKey(hop)
    keysToHops[key] ??= []
    keysToHops[key].push(hop)
  }

  return (
    <g style={dropShadowStyle}>
      {
        Object.values(keysToHops).map((hops) => {
          const hop = hops[0]
          const colors = hops.map((hop) => game.lines.find((line) => hop.lineId === line.id)?.color)
          const [head, tail] = getGameHopHeadAndTail(game, hop)
          const [hx, hy, tx, ty] = [head.x, head.y, tail.x, tail.y]
          const angle = angleBetween(hx, hy, tx, ty) - Math.PI * 0.5
          const magnitude = options.hopStrokeWidth
          return (
            <g key={hop.id}>
              {colors.map((color, i) => {
                const [hx2, hy2, tx2, ty2] = [
                  ...projectPoint(hx, hy, angle, magnitude * (i - colors.length * 0.5)),
                  ...projectPoint(tx, ty, angle, magnitude * (i - colors.length * 0.5))
                ]
                return (
                  <path key={i} d={`M${hx2} ${hy2} L${tx2} ${ty2}`} stroke={color} strokeWidth={options.hopStrokeWidth} />
                )
              })}
            </g>
          )
        })
      }
    </g>
  )
}

const VirtualStation = ({ game, station, options }: { game: GameResponse, station: StationResponse, options: GraphOptions }) => {
  const width = 200
  const height = 100
  const offsetY = 24
  const radius = options.virtualStationRadius
  return (
    <>
      <circle key={station.id} cx={station.x} cy={station.y} r={radius} fill={options.stationFill} stroke={options.stationStroke} strokeWidth={options.stationStrokeWidth} style={dropShadowStyle} />
    </>
  )
}

const RealStation = ({ game, station, options }: { game: GameResponse, station: StationResponse, options: GraphOptions }) => {
  const width = 200
  const height = 100
  const offsetY = 24
  const radius = options.stationRadius
  return (
    <>
      <circle key={station.id} cx={station.x} cy={station.y} r={radius} fill={options.stationFill} stroke={options.stationStroke} strokeWidth={options.stationStrokeWidth} style={dropShadowStyle} />
      <svg width={width} height={height} x={station.x - width * 0.5} y={station.y - height * 0.5 + offsetY} style={dropShadowStyle}>
        <rect x="0" y="0" width={width} height={height} fill="none"/>
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="0.6em">{station.title}</text>    
      </svg>
    </>
  )
}

const Station = ({ game, station, options }: { game: GameResponse, station: StationResponse, options: GraphOptions }) => {
  const width = 200
  const height = 100
  const offsetY = 24
  const radius = station.virtual ? options.virtualStationRadius : options.stationRadius
  return (
    station.virtual
    ? <VirtualStation game={game} station={station} options={options} />
    : <RealStation game={game} station={station} options={options} />
  )
}

const HopTrain = ({ game, train, options }: { game: GameResponse, train: TrainResponse, options: GraphOptions }) => {
  const hop = game.hops.find((hop) => hop.id === train.hopId)!
  const percent = train.distance / hop.length
  const { x, y } = getGameHopRelativePosition(game, hop, percent)
  return (
    <>
      {/* <circle cx={x} cy={y} r={options.trainRadius} fill={train.color} style={dropShadowStyle} /> */}
      <rect x={x - options.trainRadius} y={y - options.trainRadius} width={options.trainRadius * 2.0} height={options.trainRadius * 2.0} fill={train.color} style={dropShadowStyle} />
    </>
  )
}

const StationTrain = ({ game, train, options }: { game: GameResponse, train: TrainResponse, options: GraphOptions }) => {
  const station = game.stations.find((station) => station.id === train.stationId)!;
  return (
    <>
      {/* <circle cx={station.x} cy={station.y} r={options.trainRadius} fill={train.color} style={dropShadowStyle} /> */}
      <rect x={station.x - options.trainRadius} y={station.y - options.trainRadius} width={options.trainRadius * 2.0} height={options.trainRadius * 2.0} fill={train.color} style={dropShadowStyle} />
    </>
  )
}

const Train = ({ game, train, options }: { game: GameResponse, train: TrainResponse, options: GraphOptions }) => (
  train.hopId
  ? <HopTrain game={game} train={train} options={options} />
  : <StationTrain game={game} train={train} options={options} />
)

export const Graph = ({ game }: { game: GameResponse }) => {
  const options = {
    hopStrokeWidth: 4,
    stationStroke: '#f5f5f4',
    stationStrokeWidth: 4,
    stationFill: '#0c0a09',
    stationRadius: 8,
    virtualStationRadius: 5,
    trainRadius: 7,
    offset: {
      x: 100,
      y: 100
    },
    size: {
      x: 500,
      y: 500
    }
  }

  const viewBox = `${-options.offset.x} ${-options.offset.y} ${options.size.x} ${options.size.y}`

  

  return (
    <div className="App">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox}>
        <g>
          {<Hops game={game} options={options} />}
        </g>
        <g>
          {game?.stations.map((station) => (
            <Station key={station.id} game={game} station={station} options={options} />
          ))}
        </g>
        <g>
          {game?.trains.map((train) => (
            <Train key={train.id} game={game} train={train} options={options} />
          ))}
        </g>
      </svg>
    </div>
  );
}