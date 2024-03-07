'use client'

import { Graph } from '@/components/graph';
import { useGameHook } from '@/hooks/useGameHook';
import { useGraphOptions } from '@/hooks/useGraphOptions';
import { useEffect, useState } from 'react';

const formatDate = (d: Date) => {
  const year = d.getFullYear().toString().padStart(4, '0')
  const month = d.getMonth().toString().padStart(2, '0')
  const date = d.getDate().toString().padStart(2, '0')
  const hour = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const seconds = d.getSeconds().toString().padStart(2, '0')
  return `${year}/${month}/${date} ${hour}:${minutes}:${seconds}`
}

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

const BasicInfo = ({ game, gameTurn }: { game: GameResponse, gameTurn: GameTurnResponse }) => {
  return (
    <>
      <h2 className="text-xl text-sky-500 font-semibold mt-4 mb-4">Basic Info</h2>
      <div className="w-full text-sm mb-4">
        <div className="grid grid-cols-4 mb-2">
          <div className="font-bold whitespace-nowrap">Game Title</div>
          <div className="col-span-3">{game.title}</div>
        </div>
        <div className="grid grid-cols-4 mb-2">
          <div className="font-bold whitespace-nowrap">Turn Number</div>
          <div className="col-span-3">#{game.turnNumber}</div>
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
    </>
  )
}

const AgentsInfo = ({ game, gameTurn }: { game: GameResponse, gameTurn: GameTurnResponse }) => {
  const [agentNamesToDistances, setAgentNamesToDistances] = useState<Record<string, number> | null>(null)
  useEffect(() => {
    if (!gameTurn) {
      return
    }
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

  return (
    <>
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
    </>
  )
}

const TrainsInfo = ({ game, gameTurn }: { game: GameResponse, gameTurn: GameTurnResponse }) => {
  return (
    <>
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
    </>
  )
}

const StationsInfo = ({ game, gameTurn }: { game: GameResponse, gameTurn: GameTurnResponse }) => {
  return (
    <>
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
    </>
  )
}

const MessagesInfo = ({ game, gameTurn, messages }: { game: GameResponse, gameTurn: GameTurnResponse, messages: MessageResponse[] }) => {
  const groupedMessages: Record<number, MessageResponse[]> = messages?.reduce((hash: Record<number, MessageResponse[]>, message: MessageResponse) => {
    hash[message.turnNumber] ??= []
    hash[message.turnNumber] = [...hash[message.turnNumber], message]
    return hash
  }, {}) || []
  const turnNumbers: number[] = Object.keys(groupedMessages).map((n) => parseInt(n, 10)).sort().reverse()

  return (
    <>
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
    </>
  )
}

export function Gameboard({ name }: { name: string }) {
  const { gameTurn, game, messages } = useGameHook(name) || {}
  const graphOptions = useGraphOptions()

  // On each load, choose a message from the current turn
  const currentMessages = messages?.filter((message) => message.turnNumber === game?.turnNumber) || []
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

  // TODO: Better loading indicator
  if (!gameTurn || !game || !messages) {
    return <></>
  }

  return (
    <div className="grid grid-cols-4 gap-4 m-2 p-4">
      <div className="col-span-2">
        {graphOptions ? <Graph gameTurn={gameTurn} options={graphOptions} traversal={traversal} /> : null}
        {currentMessage ? <div className="truncate p-4 pb-5 font-semibold text-sm tracking-tight bg-slate-200 text-slate-800">{currentMessage.message}</div> : null}

        <BasicInfo game={game} gameTurn={gameTurn} />
      </div>

      <div className="col-span-1">
        <AgentsInfo game={game} gameTurn={gameTurn} />
        <TrainsInfo game={game} gameTurn={gameTurn} />
        <StationsInfo game={game} gameTurn={gameTurn} />
      </div>

      <div className="col-span-1">
        <MessagesInfo game={game} gameTurn={gameTurn} messages={messages} />
      </div>
    </div>
  );
}