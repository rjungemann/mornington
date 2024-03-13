const StationInfo = ({ game, gameTurn, station }: { game: GameResponse, gameTurn: GameTurnResponse, station: StationResponse }) => {
  const trains = gameTurn.trains.filter((train) => train.stationId === station.id)
  const agents = gameTurn.agents.filter((agent) => agent.stationId === station.id)

  return (
    trains.length && agents.length
    ? (
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
                    <span className="font-semibold">{t.title}</span>
                    {' '}
                    <svg key={i} className="inline-block align-baseline mr-0.5" width={10} height={8} x={0} y={0}>
                      <circle cx={5} cy={4} r={3} fill={t.color} />
                    </svg>
                    {i < trains.length - 1 ? ' ' : null}
                    {i === trains.length - 2 ? 'and ' : null}
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
                    <span className="font-semibold">{a.title}</span>
                    {' '}
                    <svg key={i} className="inline-block align-baseline mr-0.5" width={10} height={8} x={0} y={0}>
                      <circle cx={5} cy={4} r={3} fill={a.color} />
                    </svg>
                    {i < agents.length - 1 ? ' ' : null}
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
    : null
  )
}
  
const StationsInfo = ({ game, gameTurn }: { game: GameResponse, gameTurn: GameTurnResponse }) => {
  const stations = gameTurn?.stations
  .filter((station) => !station.virtual)
  .filter((station) => {
    // Only show stations with active trains or agents
    const trains = gameTurn.trains.filter((train) => train.stationId === station.id)
    const agents = gameTurn.agents.filter((agent) => agent.stationId === station.id)
    return trains.length && agents.length
  })
  return (
    <>
      <h2 className="text-xl text-sky-500 font-semibold mt-4 mb-4">Stations</h2>
      <ul className="text-sm mb-6">
        {
          stations.length
          ? (
            stations.filter((station) => !station.virtual).map((station, index) => {
              return (
                <li key={index} className="mb-2">
                  <StationInfo station={station} game={game} gameTurn={gameTurn} />
                </li>
              )
            })
          )
          : (
            <li className="mb-2">
              <div className="opacity-80 text-xs">
                No activity at stations currently.
              </div>
            </li>
          )
        }
      </ul>
    </>
  )
}

export { StationsInfo }