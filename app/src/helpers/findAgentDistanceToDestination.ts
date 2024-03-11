import { findRandomPath } from "./findRandomPath"

const findAgentDistanceToDestination = (agent: AgentResponse, gameTurn: GameTurnResponse) => {
  const destination = gameTurn.stations.find((station) => station.end)
  if (!destination) {
    return
  }
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
          return path.length
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
          return path.length
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
        return path.length
      }
    }
  }
}

export { findAgentDistanceToDestination }