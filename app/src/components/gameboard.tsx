'use client'

import { Graph } from '@/components/graph';
import { useEffect, useState } from 'react';

export function Gameboard({ name }: { name: string }) {
  // TODO: Put this in config
  const updateInterval = 5000
  // TODO: Put this in config
  const url = `http://localhost:3001/games/${name}`
  const [gameTurn, setGameTurn] = useState<GameTurnResponse | null>(null)
  const [turnNumber, setTurnNumber] = useState<number | null>(null)
  const [game, setGame] = useState<GameResponse | null>(null)
  const [messages, setMessages] = useState<MessagesResponse | null>(null)
  const [messageIndex, setMessageIndex] = useState<number>(0)
  const [agentNamesToDistances, setAgentNamesToDistances] = useState<Record<string, number> | null>(null)
  const graphOptions = {
    hopStrokeWidth: 4,
    stationStroke: '#f5f5f4',
    stationStrokeWidth: 4,
    stationFill: '#0c0a09',
    stationRadius: 8,
    virtualStationRadius: 5,
    trainRadius: 7,
    sourceRadius: 15,
    sourceStroke: '#4ade80',
    sourceStrokeWidth: 2,
    destinationRadius: 15,
    destinationStroke: '#facc15',
    destinationStrokeWidth: 2,
    offset: {
      x: 0,
      y: 0
    },
    size: {
      x: 500,
      y: 500
    }
  }

  useEffect(() => {
    // Periodically check for game updates
    const requestFn = () => {
      console.info('Fetching updated game data...')
      fetch(url)
      .then((response) => response.json())
      .then((data): void => {
        if (!data.game) {
          console.error('Could not load game data, will retry...')
          return
        }
        if (data.game.turnNumber !== turnNumber) {
          setTurnNumber(0)
        }
        setGameTurn(data.gameTurn.data)
        setTurnNumber(data.game.turnNumber)
        setGame(data.game)
        setMessages(data.messages)
      });
    }
    const interval = setInterval(requestFn, 5000)
    requestFn()
    return () => {
      clearInterval(interval)
    }
  }, []);

  const groupedMessages: Record<number, MessageResponse[]> = messages?.reduce((hash: Record<number, MessageResponse[]>, message: MessageResponse) => {
    hash[message.turnNumber] ??= []
    hash[message.turnNumber] = [...hash[message.turnNumber], message]
    return hash
  }, {}) || []
  const turnNumbers: number[] = Object.keys(groupedMessages).map((n) => parseInt(n, 10)).sort().reverse()

  // Estimate the distances of each agent from the destination
  function findRandomPath(game: GameTurnResponse, sourceName: string, destinationName: string): string[] | undefined {
    const maxTries = 10
    const source = game.stations.find((station) => station.name === sourceName)!
    const destination = game.stations.find((station) => station.name === destinationName)!
    for (let i = 0; i < maxTries; i++) {
      let current: StationResponse | undefined = source
      let stationNames: string[] = []
      while (true) {
        if (!current) {
          break
        }
        if (current.id === destination.id) {
          return stationNames
        }
        stationNames.push(current.name)
        const hops = game.hops.filter((hop) => hop.headId === current?.id)
        const hop = hops[Math.floor(Math.random() * hops.length)]
        current = game.stations
          .filter((station) => !stationNames.some((name) => name === station.name))
          .find((station) => station.id === hop.tailId)
      }
    }
    return
  }
  useEffect(() => {
    if (!gameTurn) {
      return
    }

    // TODO: Does not try and estimate distance for traveling agents
    const dictionary: Record<string, number> = {}
    const destination = gameTurn.stations.find((station) => station.end)
    for (let agent of gameTurn.agents) {
      const train = gameTurn.trains.find((train) => train.id === agent.trainId)
      if (train) {
        const hop = gameTurn.hops.find((hop) => hop.id === train.hopId)
        if (hop) {
          // Agent is on a train inside a hop
          const station = gameTurn.stations.find((station) => station.id === hop.headId)
          const estimatedDistance = station && destination ? findRandomPath(gameTurn, station.name, destination.name)?.length : null
          if (station && destination) {
            const path = findRandomPath(gameTurn, station.name, destination.name)
            if (path) {
              dictionary[agent.name] = path.length
            }
          }
        }
        else {
          // Agent is on a train inside a station
          const station = gameTurn.stations.find((station) => station.id === train.stationId)
          const estimatedDistance = station && destination ? findRandomPath(gameTurn, station.name, destination.name)?.length : null
          if (station && destination) {
            const path = findRandomPath(gameTurn, station.name, destination.name)
            if (path) {
              dictionary[agent.name] = path.length
            }
          }
        }
      }
      else {
        // Agent is in a station
        const station = gameTurn.stations.find((station) => station.id === agent.stationId)
        const estimatedDistance = station && destination ? findRandomPath(gameTurn, station.name, destination.name)?.length : null
        if (station && destination) {
          const path = findRandomPath(gameTurn, station.name, destination.name)
          if (path) {
            dictionary[agent.name] = path.length
          }
        }
      }
    }
    setAgentNamesToDistances(dictionary)
  }, [gameTurn])

  // On each load, choose a message from the current turn
  const currentMessages = messages?.filter((message) => message.turnNumber === turnNumber) || []
  const currentMessage = currentMessages[Math.floor(Math.random() * currentMessages.length)]

  const [traversal, setTraversal] = useState<string[]>([])
  // useEffect(() => {
  //   setInterval(() => {
  //     if (!game) {
  //       return
  //     }
  //     const source = game.stations.find((station) => station.start)!
  //     const destination = game.stations.find((station) => station.end)!
  //     const path = findRandomPath(game, source.name, destination.name)
  //     if (path) {
  //       setTraversal(path)
  //     }
  //     else {
  //       setTraversal([])
  //     }
  //   }, 2000)
  // }, [game])

  const formatDate = (d: Date) => {
    const year = d.getFullYear().toString().padStart(4, '0')
    const month = d.getMonth().toString().padStart(2, '0')
    const date = d.getDate().toString().padStart(2, '0')
    const hour = d.getHours().toString().padStart(2, '0')
    const minutes = d.getMinutes().toString().padStart(2, '0')
    const seconds = d.getSeconds().toString().padStart(2, '0')
    return `${year}/${month}/${date} ${hour}:${minutes}:${seconds}`
  }

  // TODO: Better loading indicator
  if (!gameTurn || !game) {
    return <></>
  }
  return (
    <main className="m-2 p-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-2">
          {graphOptions ? <Graph gameTurn={gameTurn} options={graphOptions} traversal={traversal} /> : null}

          {
            currentMessage
            ? (
              <div className="truncate p-4 pb-5 font-semibold text-sm text-sky-500 tracking-tight font-semibold bg-slate-200 text-slate-800">
                {currentMessage.message}
              </div>
            )
            : null
          }

          <h2 className="text-xl text-sky-500 font-semibold mt-4 mb-4">Basic Info</h2>
          <div className="w-full text-sm mb-4">
            <div className="grid grid-cols-4 mb-2">
              <div className="font-bold whitespace-nowrap">Game Title</div>
              <div className="col-span-3">{game.title}</div>
            </div>
            <div className="grid grid-cols-4 mb-2">
              <div className="font-bold whitespace-nowrap">Turn Number</div>
              <div className="col-span-3">#{turnNumber}</div>
            </div>
            <div className="grid grid-cols-4 mb-2">
              <div className="font-bold whitespace-nowrap">Started At</div>
              <div className="col-span-3">{formatDate(new Date(game.createdAt))}</div>
            </div>
            <div className="grid grid-cols-4 mb-2">
              <div className="font-bold whitespace-nowrap">Last Turn At</div>
              <div className="col-span-3">{formatDate(new Date(gameTurn.createdAt))}</div>
            </div>
          </div>
        </div>

        <div className="col-span-1">
          <h2 className="text-xl text-sky-500 font-semibold mt-4 mb-4">Agents</h2>
          <ul className="text-sm mb-4">
            {gameTurn?.agents.map((agent) => {
              const station = gameTurn.stations.find((station) => station.id === agent.stationId)
              const train = gameTurn.trains.find((train) => train.id === agent.trainId)
              const trainStation = train?.stationId && gameTurn.stations.find((station) => station.id === train?.stationId)
              const estimatedDistance = agentNamesToDistances?.[agent.name]
              return (
                <li key={agent.id} className="mb-2">
                  <span style={{ color: agent.color }}>{agent.title}</span>
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
                    {
                      estimatedDistance
                      ? <li>An estimated {estimatedDistance} stations away</li>
                      : null
                    }
                  </ul>
                </li>
              )
            })}
          </ul>

          <h2 className="text-xl text-sky-500 font-semibold mt-4 mb-4">Trains</h2>
          <ul className="text-sm mb-4">
            {gameTurn?.trains.map((train) => {
              const station = gameTurn.stations.find((station) => station.id === train.stationId)
              const hop = gameTurn.hops.find((hop) => hop.id === train.hopId)
              const headStation = hop ? gameTurn.stations.find((station) => station.id === hop.headId) : null
              const tailStation = hop ? gameTurn.stations.find((station) => station.id === hop.tailId) : null
              const agents = gameTurn.agents.filter((agent) => agent.trainId === train.id)
              return (
                <li key={train.id} className="mb-2">
                  <span style={{ color: train.color }}>{train.title}</span> train
                  <ul className="opacity-60 text-xs">
                    {station ? <li>Stopped at: {station.title}</li> : null}
                    {headStation && tailStation ? <li>Traveling from {headStation!.title} to {tailStation!.title}</li> : null}
                    {
                      agents.length
                      ? (
                        <li>
                          Carrying passengers:
                          &nbsp;
                          {agents.map((a) => <span key={a.id}><span style={{ color: a.color }}>{a.title}</span>&nbsp;</span>)}
                        </li>
                      )
                      : null
                    }
                  </ul>
                </li>
              )
            })}
          </ul>

          <h2 className="text-xl text-sky-500 font-semibold mt-4 mb-4">Stations</h2>
          <ul className="text-sm mb-4">
            {gameTurn?.stations.filter((station) => !station.virtual).map((station) => {
              const trains = gameTurn.trains.filter((train) => train.stationId === station.id)
              const agents = gameTurn.agents.filter((agent) => agent.stationId === station.id)
              return (
                <li key={station.id} className="mb-2">
                  {station.title}
                  <ul className="opacity-60 text-xs">
                    {
                      trains.length
                      ? (
                        <li>
                          Stopped trains:
                          &nbsp;
                          {trains.map((t) => <span key={t.id}><span style={{ color: t.color }}>{t.title}</span>&nbsp;</span>)}
                        </li>
                      )
                      : null
                    }
                    {
                      agents.length
                      ? (
                        <li>
                          Waiting passengers:
                          &nbsp;
                          {agents.map((a) => <span key={a.id}><span style={{ color: a.color }}>{a.title}</span>&nbsp;</span>)}
                        </li>
                      )
                      : null
                    }
                  </ul>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="col-span-1">
          <h2 className="text-xl text-sky-500 font-semibold mt-4 mb-4">Play-By-Play</h2>
          <p className="text-xs mb-4 bg-sky-200 text-slate-800 p-2 opacity-60">
            <span className="font-bold">Note</span>: Events are listed most recent first.
          </p>
          {turnNumbers.map((turnNumber, i) => {
            const classNames = [
              ...(i !== 0 ? ['border-solid', 'border-slate-200', 'border-opacity-60', 'border-t-2', 'pt-2'] : [])
            ]
            return (
              <div key={turnNumber} className={classNames.join(' ')}>
                <h3 className="opacity-100 font-md mb-2">Turn #{turnNumber}</h3>
                <ul className="opacity-60 text-xs mb-4">
                  {groupedMessages[turnNumber].map((message: MessageResponse) => (
                    <li key={message.id} className="mb-2">
                      <span className="opacity-60">{formatDate(new Date(message.createdAt))}</span>
                      &nbsp;
                      {message.message}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  );
}