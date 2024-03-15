import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

export function useGamesHook({ isPolling }: { isPolling?: boolean }) {
  const updateInterval = parseInt(process.env.TICK_INTERVAL || '5000', 10)
  const host = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '')
  const url = `${host}/games`
  const [games, setGames] = useState<GameListItemResponse[]>([])

  useEffect(() => {
    const requestFn = () => {
      console.info('Fetching updated games data...')
      fetch(url)
      .then((response) => response.json())
      .then((data): void => {
        setGames(data.games)
      })
    }
    requestFn()
    if (isPolling) {
      const interval = setInterval(requestFn, updateInterval)
      return () => {
        clearInterval(interval)
      }
    }
  }, [isPolling, updateInterval, url])

  return games;
}