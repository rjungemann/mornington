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
      stationNames.push(current.name)
      if (current.id === destination.id) {
        return stationNames
      }
      const hops = game.hops.filter((hop) => hop.headId === current?.id)
      const hop = hops[Math.floor(Math.random() * hops.length)]
      current = game.stations
        .filter((station) => !stationNames.some((name) => name === station.name))
        .find((station) => station.id === hop.tailId)
    }
  }
  return
}

export { findRandomPath }