import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

export function useGameHook(name: string) {
  // TODO: Put this in config
  const updateInterval = 5000
  // TODO: Put this in config
  const url = `http://localhost:3001/games/${name}`
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
    const interval = setInterval(requestFn, 5000)
    requestFn()
    return () => {
      clearInterval(interval)
    }
  }, []);

  return gameContext;
}