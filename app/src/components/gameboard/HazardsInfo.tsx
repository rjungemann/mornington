const HazardInfo = ({ hazard, game, gameTurn }: { hazard: HazardResponse, game: GameResponse, gameTurn: GameTurnResponse }) => {
  const hop = gameTurn.hops.find((hop) => hop.id === hazard.hopId)
  const headStation = hop ? gameTurn.stations.find((station) => station.id === hop.headId) : null
  const tailStation = hop ? gameTurn.stations.find((station) => station.id === hop.tailId) : null
  return (
    <>
      <span className="opacity-60">{hazard.label}</span>
      {' '}
      <span className="opacity-60">between</span>
      {' '}
      <span className="font-semibold">{headStation!.title}</span>
      {' '}
      <span className="opacity-60">and</span>
      {' '}
      <span className="font-semibold">{tailStation!.title}</span>
    </>
  )
}

const HazardsInfo = ({ game, gameTurn }: { game: GameResponse, gameTurn: GameTurnResponse }) => {
  return (
    <>
      <h2 className="text-2xl text-blue-500 font-semibold mt-4 mb-4">Hazards</h2>
      <ul className="text-md mb-6">
        {
          gameTurn?.hazards?.length
          ? (
            gameTurn?.hazards.map((hazard, index) => {
              return (
                <li key={index} className="mb-2 text-sm">
                  <HazardInfo hazard={hazard} game={game} gameTurn={gameTurn} />
                </li>
              )
            })
          )
          : (
            <li className="mb-2 text-sm opacity-80">There are no travel advisories currently.</li>
          )
        }
      </ul>
    </>
  )
}

export { HazardsInfo }