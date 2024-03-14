const TrainInfo = ({ game, gameTurn, train }: { game: GameResponse, gameTurn: GameTurnResponse, train: TrainResponse }) => {
  const station = gameTurn.stations.find((station) => station.id === train.stationId)
  const hop = gameTurn.hops.find((hop) => hop.id === train.hopId)
  const headStation = hop ? gameTurn.stations.find((station) => station.id === hop.headId) : null
  const tailStation = hop ? gameTurn.stations.find((station) => station.id === hop.tailId) : null
  const agents = gameTurn.agents.filter((agent) => agent.trainId === train.id)

  return (
    <>
      <h3 className="font-semibold">
        {train.label}
        <svg className="inline-block align-baseline ml-0.5" width={15} height={13} x={0} y={0}>
          <circle cx={7.5} cy={7.5} r={4} fill={train.color} />
        </svg>
      </h3>
      <ul className="opacity-80 text-xs">
        {station ? <li>Stopped at <span className="font-semibold">{station.title}</span></li> : null}
        {headStation && tailStation ? <li>Traveling from <span className="font-semibold">{headStation.title}</span> to <span className="font-semibold">{tailStation.title}</span></li> : null}
        {
          agents.length
          ? (
            <li>
              Carrying passengers
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
}

const TrainsInfo = ({ game, gameTurn }: { game: GameResponse, gameTurn: GameTurnResponse }) => {
  return (
    <>
      <h2 className="text-xl text-sky-500 font-semibold mt-4 mb-4">Trains</h2>
      <ul className="text-sm mb-6">
        {gameTurn?.trains.map((train, index) => {
          return (
            <li key={index} className="mb-4">
              <TrainInfo train={train} game={game} gameTurn={gameTurn} />
            </li>
          )
        })}
      </ul>
    </>
  )
}

export { TrainsInfo }