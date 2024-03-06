'use client'

import { Gameboard } from '@/components/gameboard';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function Gameboards({ name }: { name: string }) {
  const url = `http://localhost:3001/games`;
  const [games, setGames] = useState<GameMiniResponse[]>([])

  useEffect(() => {
    console.info('Fetching list of games...')
    fetch(url)
    .then((response) => response.json())
    .then((data): void => {
      setGames(data.games)
    })
  }, [])

  return (
    <main className="m-2">
      <h1 className="text-3xl text-sky-500 font-semibold mt-4 mb-4">Mornington</h1>
      
      <div className="mt-4 mb-4 flex flex-row gap-x-2">
        {games.map((game) => {
          return (
            <Link key={game.name} href={`/games/${game.name}`} className="p-4 pt-2 pb-2 border border-sky-400 text-sky-400 opacity-60 hover:opacity-100">
              {game.title}
            </Link>
          )
        })}
      </div>
      <Gameboard name={name} />
    </main>
  );
}
