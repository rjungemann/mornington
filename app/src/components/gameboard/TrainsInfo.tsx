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

export { TrainsInfo }