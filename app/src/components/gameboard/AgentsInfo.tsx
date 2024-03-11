'use client'

import { dateToHoroscopeSign } from '@/helpers/dateToHoroscopeSign'
import { findAgentDistanceToDestination } from '@/helpers/findAgentDistanceToDestination'

const AgentInfo = ({ agent, game, gameTurn }: { agent: AgentResponse, game: GameResponse, gameTurn: GameTurnResponse }) => {
  const station = gameTurn.stations.find((station) => station.id === agent.stationId)
  const train = gameTurn.trains.find((train) => train.id === agent.trainId)
  const trainStation = train?.stationId && gameTurn.stations.find((station) => station.id === train?.stationId)
  const estimatedDistance = findAgentDistanceToDestination(agent, gameTurn)
  const otherAgents = gameTurn.agents
  .filter((a) => a.id !== agent.id)
  .filter((a) => a.stationId === agent.stationId)
  const items = gameTurn.items.filter((i) => i.agentId === agent.id)
  const [horoscopeName, horoscopeTitle, horoscopeSign] = dateToHoroscopeSign(new Date(agent.birthdate))
  return (
    <>
      <h3 className="mb-2 font-semibold" style={{ color: agent.color }}>
        {agent.label}
        {' '}
        <span title={horoscopeTitle}>{horoscopeSign}</span>
      </h3>

      <div className="mb-4 text-xs opacity-60">
        {agent.description}
      </div>

      <table className="table-fixed mb-2 text-xs opacity-80 bg-slate-800 sm:w-auto lg:w-full">
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
              {items.map((item, i) => (
                item.kind === 'weapon'
                ? <li key={i}>Wielding <span className="font-semibold">{item.title}</span> ({item.damage})</li>
                : <li key={i}>Holding <span className="font-semibold">{item.title}</span></li>
              ))}
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
    </>
  )
}

const AgentsInfo = ({ game, gameTurn }: { game: GameResponse, gameTurn: GameTurnResponse }) => {
  return (
    <>
      <h2 className="text-xl text-sky-500 font-semibold mt-4 mb-4">Agents</h2>
      <ul className="text-sm mb-6">
        {gameTurn?.agents.map((agent, index) => (
          <li key={index} className="mb-4">
            <AgentInfo agent={agent} game={game} gameTurn={gameTurn} />
          </li>
        ))}
      </ul>
    </>
  )
}

export { AgentsInfo }