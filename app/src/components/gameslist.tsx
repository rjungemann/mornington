'use client'

import { Navigation } from "@/components/navigation";
import { useGamesHook } from "@/hooks/useGamesHook";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TimeAgo from 'react-timeago'

export const Gameslist = () => {
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
      <ul className="mt-2 mb-2 text-sm">
        {games.map((game, index) => {
          return (
            <li key={index} className="cursor-pointer mb-6" onClick={() => router.push(`/games/${game.name}`)}>
              <h3 className="text-sky-400 mb-2">
                {game.title}
                  {' '}
                  <span className="font-normal text-slate-200">Turn #{game.turnNumber}</span>
              </h3>

              <div className="opacity-60">
                {
                  game.finished
                  ? (
                    <>Game is <span className="text-red-400">finished</span></>
                  )
                  : (
                    <>Game is <span className="text-green-400">in-progress</span></>
                  )
                }
              </div>

              <div className="mb-2 opacity-60">
                Featuring
                {' '}
                {
                  game.agents.map((agent, i) => {
                    return (
                      <span key={i}>
                        <span style={{ color: agent.color }}>
                          {agent.title}
                        </span>
                        {i < game.agents.length - 1 ? ', ' : null}
                        {i === game.agents.length - 2 ? 'and ' : null}
                      </span>
                    )
                  })
                }
              </div>

              <div className="text-xs opacity-60">
                <span className="font-semibold text-sky-400">Started</span>
                {' '}
                <span><TimeAgo date={game.createdAt} live={false} /></span>
                {' '}
                <span className="font-semibold text-sky-400">Last update</span>
                {' '}
                <span><TimeAgo date={new Date(game.updatedAt)} live={false} /></span>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
