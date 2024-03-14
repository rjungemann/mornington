import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

export function useGameHook({ name, turnNumber, isPolling }: { name: string, turnNumber?: number, isPolling?: boolean }) {
  const updateInterval = parseInt(process.env.TICK_INTERVAL || '5000', 10)
  const host = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '')
  const url = turnNumber ? `${host}/games/${name}/turns/${turnNumber}` : `${host}/games/${name}`
  const [gameContext, setGameContext] = useState<GameContextData | null>(null)

  useEffect(() => {
    // Periodically check for game updates
    const requestFn = () => {
      console.info('Fetching updated game data...')
      fetch(url)
      .then((response) => response.json())
      .then((data): void => {
        if (!data.game) {
          console.error('Could not load game data, will retry...')
          return
        }
        setGameContext({
          game: data.game,
          gameTurn: data.gameTurn.data,
          messages: data.messages
        })
      });
    }
    requestFn()
    if (isPolling) {
      const interval = setInterval(requestFn, updateInterval)
      return () => {
        clearInterval(interval)
      }
    }
  }, [isPolling, updateInterval, url]);

  return gameContext;
}