'use client'

import { Navigation } from "@/components/navigation";
import { useGamesHook } from "@/hooks/useGamesHook";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TimeAgo from 'react-timeago'

export const OtherGameInfo = ({ game }: { game: GameListItemResponse }) => {
  return (
    <>
      <h3 className="mb-2 inline-block font-semibold text-lime-400">
        {game.title}
      </h3>

      <div className="text-xs opacity-80">
        <span className="text-slate-200">Turn #{game.turnNumber}</span>
      </div>

      <div className="text-xs opacity-80 mb-2">
        {
          game.finished
          ? <>Game is <span className="text-red-400">finished</span></>
          : <>Game is <span className="text-green-400">in-progress</span></>
        }
      </div>

      <div className="text-xs mb-2 opacity-60">
        {game.description}
      </div>

      <div className="text-xs">
        <span className="font-semibold text-sky-400">Started</span>
        {' '}
        <span><TimeAgo date={game.createdAt} live={false} /></span>
        {' '}
        <span className="font-semibold text-sky-400">Updated</span>
        {' '}
        <span><TimeAgo date={new Date(game.updatedAt)} live={false} /></span>
      </div>
    </>
  )
}

export const OtherGamesInfo = () => {
  const router = useRouter()
  const games = useGamesHook()

  // TODO: Better loading indicator
  if (!games) {
    return <></>
  }
  return (
    <>
      <h2 className="mb-4 font-semibold text-xl text-sky-400">
        Other Games
      </h2>
      <ul className="border-2 border-slate-600 divide-y-2 divide-slate-600 text-sm">
        {games.map((game, index) => {
          return (
            <li key={index} className="cursor-pointer mb-2 opacity-80 hover:opacity-100 p-4" onClick={() => router.push(`/games/${game.name}`)}>
              <OtherGameInfo game={game} />
            </li>
          )
        })}
      </ul>
    </>
  )
}
