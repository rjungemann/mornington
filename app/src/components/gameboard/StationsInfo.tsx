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

export { StationsInfo }