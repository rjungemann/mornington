'use client';

import { findRandomPath } from "@/helpers/findRandomPath";
import { useTooltip } from "@/hooks/useTooltip";
import { useTooltipMessage } from "@/hooks/useTooltipMessage";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

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
    Object.values(keysToHops).map((hops, index) => {
      return (
        hops.map((hop, i) => {
          const [head, tail] = getGameHopHeadAndTail(gameTurn, hop)
          const [hx, hy, tx, ty] = [head.x, head.y, tail.x, tail.y]
          const angle = angleBetween(hx, hy, tx, ty) - Math.PI * 0.5
          const magnitude = options.hopStrokeWidth
          const color = gameTurn.lines.find((line) => hop.lineId === line.id)?.color!
          const [hx2, hy2, tx2, ty2] = [
            ...projectPoint(hx, hy, angle, magnitude * 0.5 * hops.length * i),
            ...projectPoint(tx, ty, angle, magnitude * 0.5 * hops.length * i)
          ]
          return (
            <path key={`${index}-${i}`} d={`M${hx2} ${hy2} L${tx2} ${ty2}`} stroke={color} strokeWidth={options.hopStrokeWidth} strokeDasharray={hop.active ? undefined : '6,6'} />
          )
        })
      )
    })
  )
}

const BubbleCircle = ({ x, y, color, options, title }: { x: number, y: number, color: string, title: string, options: GraphOptions}) => {
  const tooltipMessage = useTooltipMessage(title)
  return (
    <circle {...tooltipMessage} cx={x} cy={y} r={options.bubbleAgentRadius} fill={color} stroke={options.bubbleStroke} strokeWidth={options.bubbleStrokeWidth} style={options.dropShadowStyle} />
  )
}

// TODO: Cleanup bubbles!
const StationBubble = ({ gameTurn, station, options }: { gameTurn: GameTurnResponse, station: StationResponse, options: GraphOptions }) => {
  const width = 200 // Hardcoded, just big enough that text doesn't crop
  const height = 100 // Hardcoded, just big enough that text doesn't crop

  const x = station.x - width * 0.5
  const y = station.y - height * 0.5 + options.bubbleOffsetY
  const x2 = width * 0.5 + options.bubbleOffsetX
  const y2 = height * 0.5 - options.bubbleOffsetY
  const points = [
    [0, 0],
    [options.bubbleTipWidth + 1, -(options.bubbleTipHeight * 0.5)],
    [options.bubbleTipWidth + 1, options.bubbleTipHeight * 0.5]
  ]
  .map((n) => [n[0] + x2, n[1] + y2])

  const agents = gameTurn.agents
  .filter((a) => a.timeout === 0)
  .filter((a) => a.stationId === station.id)
  if (agents.length === 0) {
    return null
  }

  return (
    <svg width={999} height={999} x={x} y={y} style={options.dropShadowStyle} stroke={options.bubbleStroke} strokeWidth={options.bubbleStrokeWidth}>
      <polyline stroke="none" fill={options.bubbleFill} points={points.map((n) => n.join(',')).join(' ')} />
      <rect stroke="none" fill={options.bubbleFill} rx={options.bubbleRadius} ry={options.bubbleRadius} x={x2 + options.bubbleTipWidth} y={y2 - options.bubbleHeight * 0.5} width={(agents.length + 1) * (options.bubbleAgentRadius * 2 + options.bubbleAgentPadding * 2)} height={options.bubbleHeight}/>
      {agents.map((a, i) => {
        const x = x2 + options.bubbleTipWidth + (i + 1) * (options.bubbleAgentRadius * 2 + options.bubbleAgentPadding * 2)
        return (
          <BubbleCircle key={i} x={x} y={y2} color={a.color} options={options} title={a.title} />
        )
      })}
    </svg>
  )
}

const TrainBubble = ({ gameTurn, train, options }: { gameTurn: GameTurnResponse, train: TrainResponse, options: GraphOptions }) => {
  const width = 200 // Hardcoded, just big enough that text doesn't crop
  const height = 100 // Hardcoded, just big enough that text doesn't crop

  const x2 = width * 0.5 + options.bubbleOffsetX
  const y2 = height * 0.5 - options.bubbleOffsetY
  const points = [
    [0, 0],
    [options.bubbleTipWidth + 1, -(options.bubbleTipHeight * 0.5)],
    [options.bubbleTipWidth + 1, options.bubbleTipHeight * 0.5]
  ]
  .map((n) => [n[0] + x2, n[1] + y2])

  let x
  let y
  const station = gameTurn.stations.find((s) => s.id === train.stationId)
  if (station) {
    x = station.x - width * 0.5
    y = station.y - height * 0.5 + options.bubbleOffsetY
  }
  else {
    const hop = gameTurn.hops.find((hop) => hop.id === train.hopId)
    if (hop) {
      const percent = train.distance / hop.length
      const result = getGameHopRelativePosition(gameTurn, hop, percent)
      x = result.x - width * 0.5
      y = result.y - height * 0.5 + options.bubbleOffsetY
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
    <svg width={999} height={999} x={x} y={y} style={options.dropShadowStyle} stroke={options.bubbleStroke} strokeWidth={options.bubbleStrokeWidth}>
      <polyline stroke="none" fill={options.bubbleFill} points={points.map((n) => n.join(',')).join(' ')} />
      <rect stroke="none" fill={options.bubbleFill} rx={options.bubbleRadius} ry={options.bubbleRadius} x={x2 + options.bubbleTipWidth} y={y2 - options.bubbleHeight * 0.5} width={(agents.length + 1) * (options.bubbleAgentRadius * 2 + options.bubbleAgentPadding * 2)} height={options.bubbleHeight}/>
      {agents.map((a, i) => {
        const x = x2 + options.bubbleTipWidth + (i + 1) * (options.bubbleAgentRadius * 2 + options.bubbleAgentPadding * 2)
        return (
          <BubbleCircle key={i} x={x} y={y2} color={a.color} options={options} title={a.title} />
        )
      })}
    </svg>
  )
}

const Station = ({ gameTurn, station, setTraversal, options }: { gameTurn: GameTurnResponse, station: StationResponse, setTraversal: Dispatch<SetStateAction<string[]>>, options: GraphOptions }) => {
  const tooltipMessage = useTooltipMessage(station.title)

  const width = 200 // Hardcoded, just big enough that text doesn't crop
  const height = 100 // Hardcoded, just big enough that text doesn't crop
  
  const radius = station.virtual ? options.virtualStationRadius : options.stationRadius
  const textX = station.x - width * 0.5
  const textY = station.y - height * 0.5 + options.stationTextOffsetY

  // const mouseOver = () => {
  //   const destination = gameTurn.stations.find((s) => s.end)
  //   if (!destination) {
  //     return
  //   }
  //   const path = findRandomPath(gameTurn, station.name, destination.name)
  //   if (path) {
  //     setTraversal(path)
  //   }
  // }

  // const mouseOut = () => {
  //   setTraversal([])
  // }

  return (
    station.virtual
    ? (
      <>
        <circle {...tooltipMessage} key={station.id} cx={station.x} cy={station.y} r={radius} fill={options.stationFill} stroke={options.stationStroke} strokeWidth={options.stationStrokeWidth} />
      </>
    )
    : (
      <>
        <circle {...tooltipMessage} cx={station.x} cy={station.y} r={radius} fill={options.stationFill} stroke={options.stationStroke} strokeWidth={options.stationStrokeWidth} />
        {
          station.start
          ? <circle cx={station.x} cy={station.y} r={options.sourceRadius} fill="none" stroke={options.sourceStroke} strokeWidth={options.sourceStrokeWidth} opacity={options.stationSourceOpacity} />
          : null
        }
        {
          station.end
          ? <circle cx={station.x} cy={station.y} r={options.destinationRadius} fill="none" stroke={options.destinationStroke} strokeWidth={options.destinationStrokeWidth} opacity={options.stationDestinationOpacity} />
          : null
        }
        <svg width={width} height={height} x={textX} y={textY}>
          <rect x="0" y="0" width={width} height={height} fill="none"/>
          {/* TODO: Options */}
          <text x="50%" y="50%" cursor="default" dominantBaseline="middle" textAnchor="middle" fill={options.stationTextColor} fontSize={options.stationFontSize} style={options.dropShadowStyle}>{station.title}</text>
        </svg>
      </>
    )
  )
}

const HopTrain = ({ gameTurn, train, options }: { gameTurn: GameTurnResponse, train: TrainResponse, options: GraphOptions }) => {
  const tooltipMessage = useTooltipMessage(train.title)
  const hop = gameTurn.hops.find((hop) => hop.id === train.hopId)!
  const percent = train.distance / hop.length
  const { x, y } = getGameHopRelativePosition(gameTurn, hop, percent)
  const points = [[1, 0], [2, 2], [0, 2]]
  .map(([x, y]) => [x - 1, y - 1.25])
  .map(([x, y]) => [x * options.trainScale, y * options.trainScale])
  .map(([x2, y2]) => [x + x2, y + y2])
  return (
    <>
      <polyline {...tooltipMessage} points={points.map((n) => n.join(',')).join(' ')} fill={train.color} style={options.dropShadowStyle} stroke={options.trainStroke} strokeWidth={options.trainStrokeWidth} />
    </>
  )
}

const StationTrain = ({ gameTurn, train, options }: { gameTurn: GameTurnResponse, train: TrainResponse, options: GraphOptions }) => {
  const tooltipMessage = useTooltipMessage(train.title)
  const { x, y } = gameTurn.stations.find((station) => station.id === train.stationId)!
  const points = [[1, 0], [2, 2], [0, 2]]
  .map(([x, y]) => [x - 1, y - 1.25])
  .map(([x, y]) => [x * options.trainScale, y * options.trainScale])
  .map(([x2, y2]) => [x + x2, y + y2])
  return (
    <>
      <polyline {...tooltipMessage} points={points.map((n) => n.join(',')).join(' ')} fill={train.color} style={options.dropShadowStyle} stroke={options.trainStroke} strokeWidth={options.trainStrokeWidth} />
    </>
  )
}

const Train = ({ gameTurn, train, options }: { gameTurn: GameTurnResponse, train: TrainResponse, options: GraphOptions }) => (
  train.hopId
  ? <HopTrain gameTurn={gameTurn} train={train} options={options} />
  : <StationTrain gameTurn={gameTurn} train={train} options={options} />
)

const Hazard = ({ gameTurn, hazard, options }: { gameTurn: GameTurnResponse, hazard: HazardResponse, options: GraphOptions }) => {
  const tooltipMessage = useTooltipMessage(hazard.title)
  const hop = gameTurn.hops.find((hop) => hop.id === hazard.hopId)!
  const percent = hazard.distance / hop.length
  const { x, y } = getGameHopRelativePosition(gameTurn, hop, percent)
  const points = [[1, 0], [2, 0], [3, 1], [3, 2], [2, 3], [1, 3], [0, 2], [0, 1]]
  .map(([x, y]) => [x - 1.5, y - 1.5])
  .map(([x, y]) => [x * options.hazardScale, y * options.hazardScale])
  .map(([x2, y2]) => [x + x2, y + y2])
  return (
    <polyline {...tooltipMessage} points={points.map((n) => n.join(',')).join(' ')} fill={hazard.color} style={options.dropShadowStyle} stroke={options.hazardStroke} strokeWidth={options.hazardStrokeWidth} />
  )
}

// TODO: Use this to show possible paths, etc.
const Traversal = ({ gameTurn, traversal, options }: { gameTurn: GameTurnResponse, traversal: string[], options: GraphOptions }) => {
  let paths = []
  for (let i = 0; i < traversal.length; i++) {
    if (i === 0) {
      continue
    }
    const head = gameTurn.stations.find((station) => station.name === traversal[i - 1])!
    const tail = gameTurn.stations.find((station) => station.name === traversal[i])!
    const [hx, hy, tx, ty] = [head.x, head.y, tail.x, tail.y]
    const angle = angleBetween(hx, hy, tx, ty) - Math.PI * 1.5
    const [cx, cy, dx, dy] = [hx, hy - options.traversalMagnitude, tx, ty - options.traversalMagnitude]
    const path = `M ${hx} ${hy} C ${cx} ${cy}, ${dx} ${dy}, ${tx} ${ty}`
    // TODO: Options
    paths.push(<path key={`${head.name}:${tail.name}`} d={path} stroke={options.traversalStroke} strokeWidth={options.traversalStrokeWidth} opacity={options.traversalOpacity} fill="transparent"/>)
  }
  return paths
}

export const Graph = ({ gameTurn, options }: { gameTurn: GameTurnResponse, options: GraphOptions }) => {
  const viewBox = `${-options.offset.x} ${-options.offset.y} ${options.size.x} ${options.size.y}`

  const [traversal, setTraversal] = useState<string[]>([])
  useTooltip()

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox} fontFamily={options.fontFamily}>
      <g opacity={0.8}>
        {<Hops gameTurn={gameTurn} options={options} />}
        {traversal ? <Traversal gameTurn={gameTurn} traversal={traversal} options={options} /> : null}
        {gameTurn?.stations.map((station, index) => (
          <Station key={index} gameTurn={gameTurn} station={station} options={options} setTraversal={setTraversal} />
        ))}
      </g>
      {gameTurn?.hazards.map((hazard, index) => (
        <Hazard key={index} gameTurn={gameTurn} hazard={hazard} options={options} />
      ))}
      {gameTurn?.trains.map((train, index) => (
        <Train key={index} gameTurn={gameTurn} train={train} options={options} />
      ))}
      {gameTurn?.stations.map((s, i) => (
        <StationBubble key={i} gameTurn={gameTurn} station={s} options={options} />
      ))}
      {gameTurn?.trains.map((t, i) => (
        <TrainBubble key={i} gameTurn={gameTurn} train={t} options={options} />
      ))}
    </svg>
  );
}