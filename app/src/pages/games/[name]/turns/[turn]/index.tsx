import { Gameboard } from '@/components/gameboard'

export default function Home({ context }: { context: GameContextData }) {
  return (
    <main className="m-2">
      <Gameboard context={context} isPolling={false} />
    </main>
  )
}

export async function getServerSideProps({ params }: { params: any }) {
  const host = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '')
  const url = `${host}/games/${params.name}/turns/${params.turn}`

  // Fetch data from external API
  console.info('Fetching initial game data...')
  const data = await fetch(url).then((response) => response.json())
  const game: GameResponse = data.game
  const gameTurn: GameTurnResponse = data.gameTurn.data
  const games: GameListItemResponse[] = data.games
  const messages: MessagesResponse = data.messages
  const context = { game, gameTurn, games, messages }
 
  // Pass data to the page via props
  return { props: { context } }
}