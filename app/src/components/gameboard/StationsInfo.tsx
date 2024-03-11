const StationInfo = ({ game, gameTurn, station }: { game: GameResponse, gameTurn: GameTurnResponse, station: StationResponse }) => {
  const trains = gameTurn.trains.filter((train) => train.stationId === station.id)
  const agents = gameTurn.agents.filter((agent) => agent.stationId === station.id)

  return (
    <>
      <h3 className="font-semibold">{station.label}</h3>
      <ul className="opacity-80 text-xs">
        {
          trains.length
          ? (
            <li>
              Stopped trains:
              {' '}
              {trains.map((t, i) => (
                <span key={i}>
                  <span className="font-semibold" style={{ color: t.color }}>{t.title}</span>
                  {i < agents.length - 1 ? ', ' : null}
                  {i === agents.length - 2 ? 'and ' : null}
                </span>
              ))}
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
              {agents.map((a, i) => (
                <span key={i}>
                  <span className="font-semibold" style={{ color: a.color }}>{a.title}</span>
                  {i < agents.length - 1 ? ', ' : null}
                  {i === agents.length - 2 ? 'and ' : null}
                </span>
              ))}
            </li>
          )
          : null
        }
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
          return (
            <li key={index} className="mb-2">
              <StationInfo station={station} game={game} gameTurn={gameTurn} />
            </li>
          )
        })}
      </ul>
    </>
  )
}

export { StationsInfo }