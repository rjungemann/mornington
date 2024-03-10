'use client'

import { Graph } from '@/components/graph';
import { useGameHook } from '@/hooks/useGameHook';
import { useGraphOptions } from '@/hooks/useGraphOptions';
import { useEffect, useState } from 'react';
import TimeAgo from 'react-timeago'
import { Gameslist } from './gameslist';

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
      <ul className="text-sm mb-6">
        {gameTurn?.agents.map((agent, index) => {
          const station = gameTurn.stations.find((station) => station.id === agent.stationId)
          const train = gameTurn.trains.find((train) => train.id === agent.trainId)
          const trainStation = train?.stationId && gameTurn.stations.find((station) => station.id === train?.stationId)
          const estimatedDistance = agentNamesToDistances?.[agent.name]
          const otherAgents = gameTurn.agents
          .filter((a) => a.id !== agent.id)
          .filter((a) => a.stationId === agent.stationId)
          const items = gameTurn.items.filter((i) => i.agentId === agent.id)
          return (
            <li key={index} className="mb-4">
              <h3 className="mb-2 font-semibold" style={{ color: agent.color }}>{agent.label}</h3>

              <table className="table-fixed mb-1 text-xs opacity-80 bg-slate-800 sm:w-auto lg:w-full">
                <thead>
                  <tr>
                    <th className="p-1 text-center">Init.</th>
                    <th className="p-1 text-center">HP</th>
                    <th className="p-1 text-center">Str.</th>
                    <th className="p-1 text-center">Dex.</th>
                    <th className="p-1 text-center">Wil.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-1 pt-0 text-center">{agent.initiative}</td>
                    <td className="p-1 pt-0 text-center">{agent.currentHp} / {agent.maxHp}</td>
                    <td className="p-1 pt-0 text-center">{agent.strength}</td>
                    <td className="p-1 pt-0 text-center">{agent.dexterity}</td>
                    <td className="p-1 pt-0 text-center">{agent.willpower}</td>
                  </tr>
                </tbody>
              </table>

              <ul className="opacity-80 text-xs">
                {
                  agent.timeout > 0
                  ? <li>Agent is in time-out for {agent.timeout} more turns</li>
                  : (
                    <>
                      {
                        items.map((item, i) => {
                          if (item.kind === 'weapon') {
                            return (
                              <li key={i}>Wielding <span className="font-semibold">{item.title}</span> ({item.damage})</li>
                            )
                          }
                          else {
                            return (
                              <li key={i}>Holding <span className="font-semibold">{item.title}</span></li>
                            )
                          }
                        })
                      }
                      {station ? <li>Waiting at <span className="font-semibold">{station.title}</span></li> : null}
                      {
                        train
                        ? (
                          trainStation
                          ? <li>Traveling on <span className="font-semibold">{train.title}</span> train, stopped at <span className="font-semibold">{trainStation.title}</span></li>
                          : <li>Traveling on <span className="font-semibold">{train.title}</span> train</li>
                        )
                        : null
                      }
                      {
                        estimatedDistance
                        ? <li>An estimated <span className="font-semibold">{estimatedDistance}</span> stations away</li>
                        : null
                      }
                      {
                        station && !station.start && agent.stationId && otherAgents.length > 0
                        ? <li>Currently locked in combat</li>
                        : null
                      }
                    </>
                  )
                }
              </ul>
            </li>
          )
        })}
      </ul>
    </>
  )
}

const HazardsInfo = ({ game, gameTurn }: { game: GameResponse, gameTurn: GameTurnResponse }) => {
  return (
    <>
      <h2 className="text-xl text-sky-500 font-semibold mt-4 mb-4">Hazards</h2>
      <ul className="text-sm mb-6">
        {
          gameTurn?.hazards?.length
          ? (
            gameTurn?.hazards.map((hazard, index) => {
              const hop = gameTurn.hops.find((hop) => hop.id === hazard.hopId)
              const headStation = hop ? gameTurn.stations.find((station) => station.id === hop.headId) : null
              const tailStation = hop ? gameTurn.stations.find((station) => station.id === hop.tailId) : null
              return (
                <li key={index} className="mb-2">
                  <span className="font-semibold">{hazard.label}</span>
                  {' '}
                  between
                  {' '}
                  <span className="font-semibold">{headStation!.title}</span>
                  {' '}
                  and
                  {' '}
                  <span className="font-semibold">{tailStation!.title}</span>
                </li>
              )
            })
          )
          : (
            <li>There are no travel advisories currently.</li>
          )
        }
      </ul>
    </>
  )
}

const TrainsInfo = ({ game, gameTurn }: { game: GameResponse, gameTurn: GameTurnResponse }) => {
  return (
    <>
      <h2 className="text-xl text-sky-500 font-semibold mt-4 mb-4">Trains</h2>
      <ul className="text-sm mb-6">
        {gameTurn?.trains.map((train, index) => {
          const station = gameTurn.stations.find((station) => station.id === train.stationId)
          const hop = gameTurn.hops.find((hop) => hop.id === train.hopId)
          const headStation = hop ? gameTurn.stations.find((station) => station.id === hop.headId) : null
          const tailStation = hop ? gameTurn.stations.find((station) => station.id === hop.tailId) : null
          const agents = gameTurn.agents.filter((agent) => agent.trainId === train.id)
          return (
            <li key={index} className="mb-4">
              <h3 className="font-semibold" style={{ color: train.color }}>{train.label}</h3>
              <ul className="opacity-80 text-xs">
                {station ? <li>Stopped at: <span className="font-semibold">{station.title}</span></li> : null}
                {headStation && tailStation ? <li>Traveling from <span className="font-semibold">{headStation.title}</span> to <span className="font-semibold">{tailStation.title}</span></li> : null}
                {
                  agents.length
                  ? (
                    <li>
                      Carrying passengers:
                      {' '}
                      {
                        agents.map((a, i) => {
                          return (
                            <span key={i}>
                              <span className="font-semibold" style={{ color: a.color }}>{a.title}</span>
                              {i < agents.length - 1 ? ', ' : null}
                              {i === agents.length - 2 ? 'and ' : null}
                            </span>
                          )
                        })
                      }
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
      <ul className="text-sm mb-6">
        {gameTurn?.stations.filter((station) => !station.virtual).map((station, index) => {
          const trains = gameTurn.trains.filter((train) => train.stationId === station.id)
          const agents = gameTurn.agents.filter((agent) => agent.stationId === station.id)
          return (
            <li key={index} className="mb-2">
              <h3 className="font-semibold">{station.label}</h3>
              <ul className="opacity-80 text-xs">
                {
                  trains.length
                  ? (
                    <li>
                      Stopped trains:
                      {' '}
                      {
                        trains.map((t, i) => {
                          return (
                            <span key={i}>
                              <span className="font-semibold" style={{ color: t.color }}>{t.title}</span>
                              {i < agents.length - 1 ? ', ' : null}
                              {i === agents.length - 2 ? 'and ' : null}
                            </span>
                          )
                        })
                      }
                    </li>
                  )
                  : null
                }
                {
                  agents.length
                  ? (
                    <li>
                      Waiting passengers:
                      {' '}
                      {
                        agents.map((a, i) => {
                          return (
                            <span key={i}>
                              <span className="font-semibold" style={{ color: a.color }}>{a.title}</span>
                              {i < agents.length - 1 ? ', ' : null}
                              {i === agents.length - 2 ? 'and ' : null}
                            </span>
                          )
                        })
                      }
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
      <p className="text-xs mb-4 bg-slate-200 text-slate-800 p-2 opacity-80">
        <span className="font-bold">Note</span>: Events are listed most recent first.
      </p>
      <ul className="opacity-80 text-xs mb-4">
        {messages.map((message: MessageResponse, i) => (
          <li key={i} className="mb-2">
            <span className="text-sky-400">
              #{message.turnNumber}
            </span>
            {' '}
            <span className="opacity-80">
              <TimeAgo date={message.createdAt} live={false} />
            </span>
            {' '}
            {message.message}
          </li>
        ))}
      </ul>
    </>
  )
}

const AboutInfo = () => {
  return (
    <div className='bg-slate-800 mt-4 p-4'>
      <h2 className="text-xl text-sky-500 font-semibold mt-4 mb-4">About Mornington</h2>
      <div className="opacity-80 mb-4">
        <p className="mb-2">
          Mornington is a subway simulator and game inspired by a certain BBC Radio show.
        </p>
        <p className="mb-2">
          It was created by <a className="text-lime-400" href="https://phasor.space">Phasor Space</a>.
        </p>
        <p className="mb-2">
          The code can be found on <a className="text-lime-400" href="https://github.com/rjungemann/mornington">GitHub</a>.
        </p>
      </div>
    </div>
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
    <div className="p-4 m-2">
      <h1 className="mb-4 font-semibold text-xl text-sky-400">
        {game.title}
        {' '}
        <span className="text-slate-200">Turn #{game.turnNumber}</span>
      </h1>

      <div className="grid sm:grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="sm:col-span-1 lg:col-span-2">
          {graphOptions ? <Graph gameTurn={gameTurn} options={graphOptions} traversal={traversal} /> : null}
          {currentMessage ? <div className="p-4 pb-5 font-semibold text-sm tracking-tight bg-slate-200 text-slate-800">{currentMessage.message}</div> : null}

          <div className="mt-6 mb-6 text-sm">
            <span>
              <span className="font-semibold text-sky-400">Started</span>
              {' '}
              <span><TimeAgo date={game.createdAt} live={false} /></span>
            </span>
            {' '}
            <span>
              <span className="font-semibold text-sky-400">Last update</span>
              {' '}
              <span><TimeAgo date={new Date(game.updatedAt)} live={false} /></span>
            </span>
          </div>

          <div className="mt-4 mb-4">
            <Gameslist />
          </div>
        </div>

        <div className="col-span-1">
          <AgentsInfo game={game} gameTurn={gameTurn} />
          <HazardsInfo game={game} gameTurn={gameTurn} />
          <TrainsInfo game={game} gameTurn={gameTurn} />
          <StationsInfo game={game} gameTurn={gameTurn} />
        </div>

        <div className="col-span-1">
          <MessagesInfo game={game} gameTurn={gameTurn} messages={messages} />
        </div>
      </div>

      <AboutInfo />
    </div>
  );
}