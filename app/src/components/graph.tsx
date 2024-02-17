'use client';

const lerp = (a: number, b: number, t: number) => ((1 - t) * a + t * b);
const getGameHopHeadAndTail = (game: GameResponse, hop: HopResponse): [StationResponse, StationResponse] => {
  const head = game!.stations.find((station) => station.id === hop.headId)!
  const tail = game!.stations.find((station) => station.id === hop.tailId)!
  return [head, tail]
}

const getGameHopRelativePosition = (game: GameResponse, hop: HopResponse, percent: number): Position => {
  const [head, tail] = getGameHopHeadAndTail(game, hop)
  const x = lerp(head.x, tail.x, percent)
  const y = lerp(head.y, tail.y, percent)
  return { x, y }
}

const Hop = ({ game, hop, options }: { game: GameResponse, hop: HopResponse, options: GraphOptions }) => {
  const [head, tail] = getGameHopHeadAndTail(game, hop)
  return (
    <path key={hop.id} d={`M${head.x} ${head.y} L${tail.x} ${tail.y}`} stroke={options.hopStroke} strokeWidth={options.hopStrokeWidth}/>
  )
}

const Station = ({ game, station, options }: { game: GameResponse, station: StationResponse, options: GraphOptions }) => (
  <circle key={station.id} cx={station.x} cy={station.y} r={options.stationRadius} fill={options.stationFill}/>
)

const HopTrain = ({ game, train, options }: { game: GameResponse, train: TrainResponse, options: GraphOptions }) => {
  const hop = game.hops.find((hop) => hop.id === train.hopId)!
  const percent = train.distance / hop.length
  const { x, y } = getGameHopRelativePosition(game, hop, percent)
  return (
    <circle key={train.id} cx={x} cy={y} r={options.trainRadius} fill={train.color}/>
  )
}

const StationTrain = ({ game, train, options }: { game: GameResponse, train: TrainResponse, options: GraphOptions }) => {
  const station = game.stations.find((station) => station.id === train.stationId)!;
  return (
    <circle key={train.id} cx={station.x} cy={station.y} r={options.trainRadius} fill={train.color}/>
  )
}

const Train = ({ game, train, options }: { game: GameResponse, train: TrainResponse, options: GraphOptions }) => (
  train.hopId
  ? <HopTrain game={game} train={train} options={options} />
  : <StationTrain game={game} train={train} options={options} />
)

export const Graph = ({ game }: { game: GameResponse }) => {
  const options = {
    hopStroke: '#61DAFB',
    hopStrokeWidth: 2,
    stationFill: '#61DAFB',
    stationRadius: 10,
    trainFill: '#00FF00',
    trainRadius: 6,
    offset: {
      x: 100,
      y: 100
    },
    size: {
      x: 600,
      y: 600
    }
  }

  const viewBox = `${-options.offset.x} ${-options.offset.y} ${options.size.x} ${options.size.y}`

  return (
    <div className="App">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox}>
        <g>
          {game?.hops.map((hop) => (
            <Hop key={hop.id} game={game} hop={hop} options={options} />
          ))}
        </g>
        <g>
          {game?.stations.map((station) => (
            <Station key={station.id} game={game} station={station} options={options} />
          ))}
        </g>
        <g>
          {game?.trains.map((train) => (
            <Train key={train.id} game={game} train={train} options={options} />
          ))}
        </g>
      </svg>
    </div>
  );
}