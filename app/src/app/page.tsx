import { Gameboard } from '@/components/gameboard'

export default function Home() {
  const defaultGameName = process.env.DEFAULT_GAME_NAME || 'one'

  return (
    <main className="m-2">
      <Gameboard name={defaultGameName} />
    </main>
  )
}
