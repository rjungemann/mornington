import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

export function useGameHook({ context, isPolling }: { context: GameContextData, isPolling?: boolean }) {
  const updateInterval = parseInt(process.env.TICK_INTERVAL || '5000', 10)
  const name = context.game.name
  const host = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '')
  const url = `${host}/games/${name}`
  const [gameContext, setGameContext] = useState<GameContextData>(context)

  useEffect(() => {
    setGameContext(context)
  }, [context])

  useEffect(() => {
    if (!isPolling) {
      return
    }
    // Periodically check for game updates
    const requestFn = () => {
      console.info('Fetching updated game data...', url)
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
          games: data.games,
          messages: data.messages
        })
      })
      .catch((error: Error) => {
        console.error('Could not fetch game data, will retry...', error)
      })
    }
    requestFn()
    const interval = setInterval(requestFn, updateInterval)
    return () => {
      clearInterval(interval)
    }
  }, [isPolling, updateInterval, url]);

  return gameContext;
}