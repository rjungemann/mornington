const HazardInfo = ({ hazard, game, gameTurn }: { hazard: HazardResponse, game: GameResponse, gameTurn: GameTurnResponse }) => {
  const hop = gameTurn.hops.find((hop) => hop.id === hazard.hopId)
  const headStation = hop ? gameTurn.stations.find((station) => station.id === hop.headId) : null
  const tailStation = hop ? gameTurn.stations.find((station) => station.id === hop.tailId) : null
  return (
    <>
      <span className="font-semibold">{hazard.label}</span>
      {' '}
      between
      {' '}
      <span className="font-semibold">{headStation!.title}</span>
      {' '}
      and
      {' '}
      <span className="font-semibold">{tailStation!.title}</span>
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
              return (
                <li key={index} className="mb-2 text-xs">
                  <HazardInfo hazard={hazard} game={game} gameTurn={gameTurn} />
                </li>
              )
            })
          )
          : (
            <li className="mb-2 text-xs">There are no travel advisories currently.</li>
          )
        }
      </ul>
    </>
  )
}

export { HazardsInfo }