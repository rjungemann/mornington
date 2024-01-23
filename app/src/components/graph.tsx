'use client';

import { useEffect, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

// TODO: label
type StationResponse = {
  id: number
  name: string
  label: string
  x: number
  y: number
}

// TODO: label
type HopResponse = {
  id: number
  label: string
  headId: number
  tailId: number
}

type GameResponse = {
  stations: StationResponse[]
  hops: HopResponse[]
}

type StationItem = {
  data: {
    id: string
    label: string
  }
  position: {
    x: number,
    y: number
  }
}

type HopItem = {
  data: {
    source: string,
    target: string,
    label: string
  }
}

type GraphItem = StationItem | HopItem

const stationResponseToStationItem = (station: StationResponse): StationItem => ({
  data: {
    id: String(station.id),
    label: station.label
  },
  position: {
    x: station.x,
    y: station.y
  }
})

const hopResponseToHopItem = (hop: HopResponse): HopItem => ({
  data: {
    label: hop.label,
    source: String(hop.headId),
    target: String(hop.tailId)
  }
})

const gameResponseToGraphItems = (game: GameResponse): GraphItem[] => ([
  ...game.stations.map(stationResponseToStationItem),
  ...game.hops.map(hopResponseToHopItem)
])

export const Graph = (props: any) => {
  const [game, setGame] = useState<GameResponse | null>(null);
  const [graphItems, setGraphItems] = useState<GraphItem[]>([]);
  useEffect(() => {
    fetch('http://localhost:3001/games/1')
    .then((response) => response.json())
    .then((data) => setGame(data));
  }, []);
  useEffect(() => {
    console.log('Game changed', game)
    if (game) {
      setGraphItems(gameResponseToGraphItems(game))
    }
  }, [game])
  useEffect(() => {
    console.log('Graph items changed', graphItems)
  })

  const elements = [
    { data: { id: 'one', label: 'Node 1' }, position: { x: 0, y: 0 } },
    { data: { id: 'two', label: 'Node 2' }, position: { x: 100, y: 0 } },
    { data: { source: 'one', target: 'two', label: 'Edge from Node1 to Node2' } }
  ];
  const pan = { x: 100, y: 200 }
  const style = {
    width: '600px',
    height: '600px'
  }

  return (
    <CytoscapeComponent
      elements={graphItems}
      pan={pan}
      style={style}
    />
  );
}