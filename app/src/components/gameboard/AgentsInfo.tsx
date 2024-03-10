'use client'

import { useEffect, useState } from 'react'
import { findRandomPath } from '@/helpers/findRandomPath'

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

export { AgentsInfo }