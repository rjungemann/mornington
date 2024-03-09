'use client'

import { Navigation } from "@/components/navigation";
import { useGamesHook } from "@/hooks/useGamesHook";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TimeAgo from 'react-timeago'

export default function Page() {
  const router = useRouter()
  const games = useGamesHook()

  // TODO: Better loading indicator
  if (!games) {
    return <></>
  }
  return (
    <main className="m-2">
      <div className="m-2">
        <Navigation />
      
        <div className="p-4 m-2">
          <h1 className="mb-4 font-semibold text-xl text-sky-400">
            Games
          </h1>
          <ul className="mt-2 mb-2">
            {games.map((game, index) => {
              return (
                <li key={index} className="cursor-pointer mb-6" onClick={() => router.push(`/games/${game.name}`)}>
                  <h2 className="text-lg text-sky-400 font-semibold">
                    {game.title}
                      {' '}
                      <span className="font-normal text-white">Turn #{game.turnNumber}</span>
                  </h2>

                  <div>
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

                  <div className="mb-2">
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

                  <div className="text-xs">
                    <span className="font-semibold text-sky-400">Started</span>
                    {' '}
                    <span><TimeAgo date={game.createdAt} live={false} /></span>
                  </div>

                  <div className="text-xs">
                    <span className="font-semibold text-sky-400">Last update</span>
                    {' '}
                    <span><TimeAgo date={new Date(game.updatedAt)} live={false} /></span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </main>
  );
}
