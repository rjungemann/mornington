import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

export function useGamesHook() {
  const updateInterval = parseInt(process.env.TICK_INTERVAL || '5000', 10)
  const host = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '')
  const url = `${host}/games` || `${host}/games`
  const [games, setGames] = useState<GameListItemResponse[]>([])

  useEffect(() => {
    const requestFn = () => {
      console.info('Fetching updated game data...')
      fetch(url)
      .then((response) => response.json())
      .then((data): void => {
        console.info('Fetching list of games...')
        fetch(url)
        .then((response) => response.json())
        .then((data): void => {
          setGames(data.games)
        })
      });
    }
    const interval = setInterval(requestFn, updateInterval)
    requestFn()
    return () => {
      clearInterval(interval)
    }
  }, [updateInterval, url])

  return games;
}