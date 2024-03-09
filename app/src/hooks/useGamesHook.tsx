import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

export function useGamesHook() {
  const host = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const url = `${host}/games` || `${host}/games`
  const [games, setGames] = useState<GameListItemResponse[]>([])

  useEffect(() => {
    console.info('Fetching list of games...')
    fetch(url)
    .then((response) => response.json())
    .then((data): void => {
      setGames(data.games)
    })
  }, [])

  return games;
}