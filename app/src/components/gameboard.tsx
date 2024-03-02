'use client'

import { Graph } from '@/components/graph';
import { useEffect, useState } from 'react';

export function Gameboard() {
  // TODO: Put this in config
  const updateInterval = 5000
  // TODO: Put this in config
  const url = 'http://localhost:3001/games/one';
  const [game, setGame] = useState<GameResponse | null>(null);
  useEffect(() => {
    // Periodically check for game updates
    const requestFn = () => {
      console.info('Fetching updated game data...')
      fetch(url)
      .then((response) => response.json())
      .then((data) => setGame(data.game));
    }
    const interval = setInterval(requestFn, 5000)
    requestFn()
    return () => {
      clearInterval(interval)
    }
  }, []);

  return (
    <main className="m-2">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 border-solid border-2 border-sky-500">
          {game ? <Graph game={game} /> : null}
        </div>

        <div>
          <h2 className="text-xl text-sky-500 font-semibold mt-8 mb-4">Agents</h2>
          <ul className="text-sm">
            {game?.agents.map((agent) => {
              const station = game.stations.find((station) => station.id === agent.stationId)
              const train = game.trains.find((train) => train.id === agent.trainId)
              const trainStation = train?.stationId && game.stations.find((station) => station.id === train?.stationId)
              return (
                <li key={agent.id} className="mb-2">
                  {agent.title}
                  <ul className="opacity-60 text-xs">
                    {station ? <li>Waiting at {station.title}</li> : null}
                    {
                      train
                      ? (
                        trainStation
                        ? <li>Traveling on {train.title} train, stopped at {trainStation?.title}</li>
                        : <li>Traveling on {train.title} train</li>
                      )
                      : null
                    }
                  </ul>
                </li>
              )
            })}
          </ul>

          <h2 className="text-xl text-sky-500 font-semibold mt-8 mb-4">Stations</h2>
          <ul className="text-sm">
            {game?.stations.filter((station) => !station.virtual).map((station) => {
              const trains = game.trains.filter((train) => train.stationId === station.id)
              const agents = game.agents.filter((agent) => agent.stationId === station.id)
              return (
                <li key={station.id} className="mb-2">
                  {station.title}
                  <ul className="opacity-60 text-xs">
                    {trains.length ? <li>Stopped trains: {trains.map((t) => `${t.title} train`).join(', ')}</li> : null}
                    {agents.length ? <li>Waiting passengers: {agents.map((a) => a.title).join(', ')}</li> : null}
                  </ul>
                </li>
              )
            })}
          </ul>

          <h2 className="text-xl text-sky-500 font-semibold mt-8 mb-4">Trains</h2>
          <ul className="text-sm">
            {game?.trains.map((train) => {
              const station = game.stations.find((station) => station.id === train.stationId)
              const hop = game.hops.find((hop) => hop.id === train.hopId)
              const headStation = hop ? game.stations.find((station) => station.id === hop.headId) : null
              const tailStation = hop ? game.stations.find((station) => station.id === hop.tailId) : null
              const agents = game.agents.filter((agent) => agent.trainId === train.id)
              return (
                <li key={train.id} className="mb-2">
                  <span style={{ color: train.color }}>{train.title}</span> train
                  <ul className="opacity-60 text-xs">
                    {station ? <li>Stopped at: {station.title}</li> : null}
                    {headStation && tailStation ? <li>Traveling from {headStation!.title} to {tailStation!.title}</li> : null}
                    {agents.length ? <li>Carrying passengers: {agents.map((a) => a.title).join(', ')}</li> : null}
                  </ul>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </main>
  );
}