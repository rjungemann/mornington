'use client';

import { useEffect, useState } from 'react';

type StationResponse = {
  id: number
  name: string
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
  label: string
  distance: number
  speed: number
  stationId: number
  hopId: number
}

type AgentResponse = {
  id: number
  name: string
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

const lerp = (a: number, b: number, t: number) => ((1 - t) * a + t * b);
const getGameHopHeadAndTail = (game: GameResponse, hop: HopResponse): [StationResponse, StationResponse] => {
  return [
    game!.stations.find((station) => station.id === hop.headId)!,
    game!.stations.find((station) => station.id === hop.tailId)!
  ]
}
const getGameHopRelativePosition = (game: GameResponse, hop: HopResponse, percent: number): Position => {
  const [head, tail] = getGameHopHeadAndTail(game, hop)
  const x = lerp(head.x, tail.x, percent)
  const y = lerp(head.y, tail.y, percent)
  return { x, y }
}

export const Graph = (props: any) => {
  const [game, setGame] = useState<GameResponse | null>(null);
  useEffect(() => {
    fetch('http://localhost:3001/games/1')
    .then((response) => response.json())
    .then((data) => setGame(data));
  }, []);

  const stroke = "#61DAFB"
  const fill = "#61DAFB"
  const radius = 10
  const offset = {
    x: 100,
    y: 100
  }
  const size = {
    x: 600,
    y: 600
  }
  const viewBox = `${-offset.x} ${-offset.y} ${size.x} ${size.y}`

  if (game) {
    const percent = 0.5
    const hop = game!.hops[1]
    const { x, y } = getGameHopRelativePosition(game, hop, percent)
    console.log('lerp', { x, y })
  }

  return (
    <div className="App">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox}>
        <g fill={fill}>
          {game?.hops.map((hop) => {
            const [head, tail] = getGameHopHeadAndTail(game, hop)
            return (
              <path key={hop.id} d={`M${head.x} ${head.y} L${tail.x} ${tail.y}`} stroke={stroke}/>
            )
          })}
          {game?.stations.map((station) => {
            return (
              <circle key={station.id} cx={station.x} cy={station.y} r={radius}/>
            )
          })}
          {game?.trains.map((train) => {
            if (train.hopId) {
              const hop = game.hops.find((hop) => hop.id === train.hopId)!
              const percent = train.distance / hop.length
              const { x, y } = getGameHopRelativePosition(game, hop, percent)
              return (
                <circle key={train.id} cx={x} cy={y} r={radius} fill='#00FF00'/>
              )
            } else {
              console.log('Train in station not rendered')
              return null;
            }
          })}
        </g>
      </svg>
    </div>
  );
}