'use client';

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
        Object.values(keysToHops).map((hops) => {
          const hop = hops[0]
          const colors = hops.map((hop) => gameTurn.lines.find((line) => hop.lineId === line.id)?.color)
          const [head, tail] = getGameHopHeadAndTail(gameTurn, hop)
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

const RealStation = ({ gameTurn, station, options }: { gameTurn: GameTurnResponse, station: StationResponse, options: GraphOptions }) => {
  const width = 200
  const height = 100
  const offsetY = 24
  const radius = options.stationRadius
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
      <svg width={width} height={height} x={station.x - width * 0.5} y={station.y - height * 0.5 + offsetY}>
        <rect x="0" y="0" width={width} height={height} fill="none"/>
        {/* TODO: Options */}
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="0.6em">{station.title}</text>    
      </svg>
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
  return (
    <>
      <rect x={x - options.trainRadius} y={y - options.trainRadius} width={options.trainRadius * 2.0} height={options.trainRadius * 2.0} fill={train.color} />
    </>
  )
}

const StationTrain = ({ gameTurn, train, options }: { gameTurn: GameTurnResponse, train: TrainResponse, options: GraphOptions }) => {
  const station = gameTurn.stations.find((station) => station.id === train.stationId)!;
  return (
    <>
      <rect x={station.x - options.trainRadius} y={station.y - options.trainRadius} width={options.trainRadius * 2.0} height={options.trainRadius * 2.0} fill={train.color} />
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
  return (
    <>
      {/* TODO: Add to options */}
      <circle cx={x} cy={y} r={options.trainRadius} fill={hazard.color} />
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
          {gameTurn?.stations.map((station) => (
            <Station key={station.id} gameTurn={gameTurn} station={station} options={options} />
          ))}
        </g>
        <g>
          {gameTurn?.trains.map((train) => (
            <Train key={train.id} gameTurn={gameTurn} train={train} options={options} />
          ))}
        </g>
        <g>
          {gameTurn?.hazards.map((hazard) => (
            <Hazard key={hazard.id} gameTurn={gameTurn} hazard={hazard} options={options} />
          ))}
        </g>
        {/* <g>
          {traversal ? <Traversal gameTurn={gameTurn} traversal={traversal} /> : null}
        </g> */}
      </svg>
    </div>
  );
}