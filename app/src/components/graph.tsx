'use client';

const dropShadowStyle = { filter: 'drop-shadow(0px 2px 1px rgb(0 0 0 / 0.6))' }

const lerp = (a: number, b: number, t: number) => ((1 - t) * a + t * b);
const getGameHopHeadAndTail = (gameTurn: GameTurnResponse, hop: HopResponse): [StationResponse, StationResponse] => {
  const head = gameTurn.stations.find((station) => station.id === hop.headId)!
  const tail = gameTurn.stations.find((station) => station.id === hop.tailId)!
  return [head, tail]
}

const getGameHopRelativePosition = (gameTurn: GameTurnResponse, hop: HopResponse, percent: number): Position => {
  const [head, tail] = getGameHopHeadAndTail(gameTurn, hop)
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

const Hops = ({ gameTurn, options }: { gameTurn: GameTurnResponse, options: GraphOptions }) => {
  const hopToKey = (hop: HopResponse) => `${[hop.headId, hop.tailId].sort().join(':')}`
  let keysToHops: Record<string, HopResponse[]> = {}
  for (let hop of gameTurn.hops) {
    const key = hopToKey(hop)
    keysToHops[key] ??= []
    keysToHops[key].push(hop)
  }

  return (
    <>
      {
        Object.values(keysToHops).map((hops, index) => {
          const hop = hops[0]
          const colors = hops.map((hop) => gameTurn.lines.find((line) => hop.lineId === line.id)?.color)
          const [head, tail] = getGameHopHeadAndTail(gameTurn, hop)
          const [hx, hy, tx, ty] = [head.x, head.y, tail.x, tail.y]
          const angle = angleBetween(hx, hy, tx, ty) - Math.PI * 0.5
          const magnitude = options.hopStrokeWidth

          return (
            <g key={index}>
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
    </>
  )
}

const VirtualStation = ({ gameTurn, station, options }: { gameTurn: GameTurnResponse, station: StationResponse, options: GraphOptions }) => {
  const width = 200
  const height = 100
  const offsetY = 24
  const radius = options.virtualStationRadius
  return (
    <>
      <circle key={station.id} cx={station.x} cy={station.y} r={radius} fill={options.stationFill} stroke={options.stationStroke} strokeWidth={options.stationStrokeWidth} />
    </>
  )
}

// TODO: Cleanup bubbles!
// TODO: Extract options
const StationBubble = ({ gameTurn, station, options }: { gameTurn: GameTurnResponse, station: StationResponse, options: GraphOptions }) => {
  const width = 200
  const height = 100
  const offsetY = 24
  const bubbleOffsetX = 12
  const bubbleHeight = 20
  const x = station.x - width * 0.5
  const y = station.y - height * 0.5 + offsetY
  const x2 = width * 0.5 + bubbleOffsetX
  const y2 = height * 0.5 - offsetY
  const points = [[0, 0], [6 + 1, -3], [6 + 1, 3]].map((n) => [n[0] + x2, n[1] + y2])

  const agents = gameTurn.agents
  .filter((a) => a.timeout === 0)
  .filter((a) => a.stationId === station.id)
  if (agents.length === 0) {
    return null
  }

  return (
    <svg width={999} height={999} x={x} y={y} style={dropShadowStyle} stroke="black" strokeWidth="0.25">
      <polyline stroke="none" fill="white" points={points.map((n) => n.join(',')).join(' ')} />
      <rect stroke="none" fill="white" rx="5" ry="5" x={x2 + 6} y={y2 - bubbleHeight * 0.5} width={(agents.length + 1) * (8 + 2)} height={bubbleHeight}/>
      {agents.map((a, i) => {
        return (
          <circle key={i} cx={x2 + 6 + (i + 1) * (8 + 2)} cy={y2} r={4} fill={a.color} stroke="black" strokeWidth="0.25" style={dropShadowStyle} />
        )
      })}
    </svg>
  )
}

const TrainBubble = ({ gameTurn, train, options }: { gameTurn: GameTurnResponse, train: TrainResponse, options: GraphOptions }) => {
  const width = 200
  const height = 100
  const offsetY = 24
  const bubbleOffsetX = 12
  const bubbleHeight = 20
  const x2 = width * 0.5 + bubbleOffsetX
  const y2 = height * 0.5 - offsetY
  const points = [[0, 0], [6 + 1, -3], [6 + 1, 3]].map((n) => [n[0] + x2, n[1] + y2])

  let x
  let y
  const station = gameTurn.stations.find((s) => s.id === train.stationId)
  if (station) {
    x = station.x - width * 0.5
    y = station.y - height * 0.5 + offsetY
  }
  else {
    const hop = gameTurn.hops.find((hop) => hop.id === train.hopId)
    if (hop) {
      const percent = train.distance / hop.length
      const result = getGameHopRelativePosition(gameTurn, hop, percent)
      x = result.x - width * 0.5
      y = result.y - height * 0.5 + offsetY
    }
  }
  // TODO: Verify conditional
  if (!x || !y) {
    return null
  }

  const agents = gameTurn.agents
  .filter((a) => a.trainId === train.id)
  .filter((a) => a.timeout === 0)
  if (agents.length === 0) {
    return null
  }

  return (
    <svg width={999} height={999} x={x} y={y} style={dropShadowStyle} stroke="black" strokeWidth="0.25">
      <polyline stroke="none" fill="white" points={points.map((n) => n.join(',')).join(' ')} />
      <rect stroke="none" fill="white" rx="5" ry="5" x={x2 + 6} y={y2 - bubbleHeight * 0.5} width={(agents.length + 1) * (8 + 2)} height={bubbleHeight}/>
      {agents.map((a, i) => {
        return (
          <circle key={i} cx={x2 + 6 + (i + 1) * (8 + 2)} cy={y2} r={4} fill={a.color} stroke="black" strokeWidth="0.25" style={dropShadowStyle} />
        )
      })}
    </svg>
  )
}

const RealStation = ({ gameTurn, station, options }: { gameTurn: GameTurnResponse, station: StationResponse, options: GraphOptions }) => {
  const width = 200
  const height = 100
  const offsetY = 24
  const radius = options.stationRadius
  const x = station.x - width * 0.5
  const y = station.y - height * 0.5 + offsetY
  const bubbleOffsetX = 12
  const bubbleHeight = 20
  return (
    <g key={station.id}>
      <circle cx={station.x} cy={station.y} r={radius} fill={options.stationFill} stroke={options.stationStroke} strokeWidth={options.stationStrokeWidth} />
      {
        station.start
        ? (
          <circle cx={station.x} cy={station.y} r={options.sourceRadius} fill="none" stroke={options.sourceStroke} strokeWidth={options.sourceStrokeWidth} opacity={0.5} />
        )
        : null
      }
      {
        station.end
        ? (
          <circle cx={station.x} cy={station.y} r={options.destinationRadius} fill="none" stroke={options.destinationStroke} strokeWidth={options.destinationStrokeWidth} opacity={0.5} />
        )
        : null
      }
      <svg width={width} height={height} x={x} y={y}>
        <rect x="0" y="0" width={width} height={height} fill="none"/>
        {/* TODO: Options */}
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#e2e8f0" fontSize="0.6em" style={dropShadowStyle}>{station.title}</text>
      </svg>
      <StationBubble gameTurn={gameTurn} station={station} options={options} />
    </g>
  )
}

const Station = ({ gameTurn, station, options }: { gameTurn: GameTurnResponse, station: StationResponse, options: GraphOptions }) => {
  const width = 200
  const height = 100
  const offsetY = 24
  const radius = station.virtual ? options.virtualStationRadius : options.stationRadius
  return (
    station.virtual
    ? <VirtualStation gameTurn={gameTurn} station={station} options={options} />
    : <RealStation gameTurn={gameTurn} station={station} options={options} />
  )
}

const HopTrain = ({ gameTurn, train, options }: { gameTurn: GameTurnResponse, train: TrainResponse, options: GraphOptions }) => {
  const hop = gameTurn.hops.find((hop) => hop.id === train.hopId)!
  const percent = train.distance / hop.length
  const { x, y } = getGameHopRelativePosition(gameTurn, hop, percent)
  const points = [[1, 0], [2, 2], [0, 2]]
  .map(([x, y]) => [x - 1, y - 1])
  .map(([x, y]) => [x * 10 * 0.9, y * 10 * 0.9])
  .map(([x2, y2]) => [x + x2, y + y2])
  return (
    <>
      {/* <rect x={x - options.trainRadius} y={y - options.trainRadius} width={options.trainRadius * 2.0} height={options.trainRadius * 2.0} fill={train.color} style={dropShadowStyle} /> */}
      <polyline stroke="none" points={points.map((n) => n.join(',')).join(' ')} fill={train.color} style={dropShadowStyle} stroke="black" strokeWidth="0.25" />
      <TrainBubble gameTurn={gameTurn} train={train} options={options} />
    </>
  )
}

const StationTrain = ({ gameTurn, train, options }: { gameTurn: GameTurnResponse, train: TrainResponse, options: GraphOptions }) => {
  const station = gameTurn.stations.find((station) => station.id === train.stationId)!
  const { x, y } = station
  const points = [[1, 0], [2, 2], [0, 2]]
  .map(([x, y]) => [x - 1, y - 1])
  .map(([x, y]) => [x * 10 * 0.9, y * 10 * 0.9])
  .map(([x2, y2]) => [x + x2, y + y2])
  return (
    <>
      {/* <rect x={station.x - options.trainRadius} y={station.y - options.trainRadius} width={options.trainRadius * 2.0} height={options.trainRadius * 2.0} fill={train.color} style={dropShadowStyle} /> */}
      <polyline stroke="none" points={points.map((n) => n.join(',')).join(' ')} fill={train.color} style={dropShadowStyle} stroke="black" strokeWidth="0.25" />
      <TrainBubble gameTurn={gameTurn} train={train} options={options} />
    </>
  )
}

const Train = ({ gameTurn, train, options }: { gameTurn: GameTurnResponse, train: TrainResponse, options: GraphOptions }) => (
  train.hopId
  ? <HopTrain gameTurn={gameTurn} train={train} options={options} />
  : <StationTrain gameTurn={gameTurn} train={train} options={options} />
)

const Hazard = ({ gameTurn, hazard, options }: { gameTurn: GameTurnResponse, hazard: HazardResponse, options: GraphOptions }) => {
  const hop = gameTurn.hops.find((hop) => hop.id === hazard.hopId)!
  const percent = hazard.distance / hop.length
  const { x, y } = getGameHopRelativePosition(gameTurn, hop, percent)
  const points = [[1, 0], [2, 0], [3, 1], [3, 2], [2, 3], [1, 3], [0, 2], [0, 1]]
  .map(([x, y]) => [x - 1.5, y - 1.5])
  .map(([x, y]) => [x * 10 * 0.67, y * 10 * 0.67])
  .map(([x2, y2]) => [x + x2, y + y2])
  return (
    <>
      {/* TODO: Add to options */}
      {/* <circle cx={x} cy={y} r={options.trainRadius} fill={hazard.color} style={dropShadowStyle} /> */}
      <polyline points={points.map((n) => n.join(',')).join(' ')} fill={hazard.color} style={dropShadowStyle} stroke="black" strokeWidth="0.25" />
    </>
  )
}

// TODO: Use this to show possible paths, etc.
const Traversal = ({ gameTurn, traversal }: { gameTurn: GameTurnResponse, traversal: string[] }) => {
  let paths = []
  for (let i = 0; i < traversal.length; i++) {
    if (i === 0) {
      continue
    }
    const head = gameTurn.stations.find((station) => station.name === traversal[i - 1])!
    const tail = gameTurn.stations.find((station) => station.name === traversal[i])!
    const [hx, hy, tx, ty] = [head.x, head.y, tail.x, tail.y]
    const magnitude = 40
    const [cx, cy, dx, dy] = [hx, hy - magnitude, tx, ty - magnitude]
    const path = `M ${hx} ${hy} C ${cx} ${cy}, ${dx} ${dy}, ${tx} ${ty}`
    // TODO: Options
    paths.push(<path key={`${head.name}:${tail.name}`} d={path} stroke="yellow" strokeWidth={2} opacity={0.6} fill="transparent"/>)
  }
  return paths
}

export const Graph = ({ gameTurn, traversal, options }: { gameTurn: GameTurnResponse, traversal: string[] | undefined, options: GraphOptions }) => {
  const viewBox = `${-options.offset.x} ${-options.offset.y} ${options.size.x} ${options.size.y}`

  return (
    <div className="border-solid border-2 border-slate-200">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox}>
        <g>
          {<Hops gameTurn={gameTurn} options={options} />}
        </g>
        <g>
          {gameTurn?.stations.map((station, index) => (
            <Station key={index} gameTurn={gameTurn} station={station} options={options} />
          ))}
        </g>
        <g>
          {gameTurn?.hazards.map((hazard, index) => (
            <Hazard key={index} gameTurn={gameTurn} hazard={hazard} options={options} />
          ))}
        </g>
        <g>
          {gameTurn?.trains.map((train, index) => (
            <Train key={index} gameTurn={gameTurn} train={train} options={options} />
          ))}
        </g>
        {/* <g>
          {traversal ? <Traversal gameTurn={gameTurn} traversal={traversal} /> : null}
        </g> */}
      </svg>
    </div>
  );
}