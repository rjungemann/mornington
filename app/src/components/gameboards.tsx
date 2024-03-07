'use client'

import { Gameboard } from '@/components/gameboard';
import { useGamesHook } from '@/hooks/useGamesHook';
import Link from 'next/link';

const Navigation = () => {
  return (
    <nav className="flex items-center justify-between flex-wrap p-6">
      <div className="flex items-center flex-shrink-0 mr-6">
        <span className="font-semibold text-xl text-sky-500 tracking-tight font-semibold bg-slate-200 text-slate-800 p-4 pt-2 pb-2 inline-block">Mornington</span>
      </div>

      <div className="block lg:hidden">
        <button className="flex items-center px-3 py-2 border rounded text-slate-200 border-slate-200 hover:text-slate-200 hover:border-slate-200">
          <svg className="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <title>Menu</title>
            <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"/>
          </svg>
        </button>
      </div>
      
      <div className="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
        <div className="text-sm font-semibold lg:flex-grow">
          <Link href="/games" className="block mt-4 lg:inline-block lg:mt-0 opacity-60 hover:opacity-100 mr-4">
            Games
          </Link>
          <Link href="/about" className="block mt-4 lg:inline-block lg:mt-0 opacity-60 hover:opacity-100 mr-4">
            About
          </Link>
        </div>
      </div>
    </nav>
  )
}

const GameLinks = ({ games }: { games: GameListItemResponse[] }) => {
  return (
    <div className="mt-2 mb-2 pl-6 pr-6 flex flex-row gap-x-2">
      {games.map((game) => {
        return (
          <Link key={game.name} href={`/games/${game.name}`} className="p-2 pt-1 pb-1 bg-slate-200 text-slate-800 text-xs opacity-60 hover:opacity-100 font-semibold">
            {game.title}
          </Link>
        )
      })}
    </div>
  )
}

export function Gameboards({ name }: { name: string }) {
  const games = useGamesHook()

  // TODO: Better loading indicator
  if (!games) {
    return <></>
  }
  return (
    <main className="m-2">
      <Navigation />
      <GameLinks games={games} />
      
      <Gameboard name={name} />
    </main>
  );
}
