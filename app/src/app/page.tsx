import { Gameboard } from '@/components/gameboard'

export default function Home() {
  const defaultGameName = process.env.DEFAULT_GAME_NAME || 'latest'

  return (
    <main className="m-2">
      <Gameboard name={defaultGameName} isPolling={true} />
    </main>
  )
}
