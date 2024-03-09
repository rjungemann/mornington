import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

export function useGamesHook() {
  const host = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '')
  const url = `${host}/games/${name}` || `${host}/games/${name}`
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