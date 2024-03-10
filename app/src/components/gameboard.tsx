'use client'

import { Graph } from '@/components/graph'
import { useGameHook } from '@/hooks/useGameHook'
import { useGraphOptions } from '@/hooks/useGraphOptions'
import { useState } from 'react'
import TimeAgo from 'react-timeago'
import { Navigation } from './navigation'
import { AgentsInfo } from './gameboard/AgentsInfo'
import { HazardsInfo } from './gameboard/HazardsInfo'
import { TrainsInfo } from './gameboard/TrainsInfo'
import { StationsInfo } from './gameboard/StationsInfo'
import { MessagesInfo } from './gameboard/MessagesInfo'
import { GameInfo } from './gameboard/GameInfo'
import { AboutInfo } from './gameboard/AboutInfo'
import { OtherGamesInfo } from './gameboard/OtherGamesInfo'

export function Gameboard({ name }: { name: string }) {
  const { gameTurn, game, messages } = useGameHook(name) || {}
  const graphOptions = useGraphOptions()

  // On each load, choose a message from the current turn
  const currentMessages = messages?.filter((message) => message.turnNumber === game?.turnNumber) || []
  const currentMessage = currentMessages[Math.floor(Math.random() * currentMessages.length)]

  const [traversal, setTraversal] = useState<string[]>([])
  // useEffect(() => {
  //   setInterval(() => {
  //     if (!game) {
  //       return
  //     }
  //     const source = game.stations.find((station) => station.start)!
  //     const destination = game.stations.find((station) => station.end)!
  //     const path = findRandomPath(game, source.name, destination.name)
  //     if (path) {
  //       setTraversal(path)
  //     }
  //     else {
  //       setTraversal([])
  //     }
  //   }, 2000)
  // }, [game])

  // TODO: Better loading indicator
  if (!gameTurn || !game || !messages) {
    return <></>
  }

  return (
    <div className="m-2">
      <Navigation />
      
      <div className="p-4 m-2">
        <h1 className="mb-4 font-semibold text-xl text-sky-400">
          {game.title}
          {' '}
          <span className="text-slate-200">Turn #{game.turnNumber}</span>
        </h1>

        <div className="grid sm:grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-1 lg:col-span-2">
            {
              graphOptions
              ? <Graph gameTurn={gameTurn} options={graphOptions} traversal={traversal} />
              : null
            }
            {
              currentMessage
              ? (
                <>
                  <div className="p-4 mb-4 bg-slate-600">
                    <div className="font-semibold text-sm">
                      {currentMessage.message}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-800">
                    <div className="opacity-80 text-sm">
                      <div className="mb-2">
                        <span className="font-semibold text-sky-500">Weather</span>
                        {' '}
                        {game.weatherLabel}
                      </div>

                      <div className="mb-2">
                        <span className="font-semibold text-sky-500">Moon Phase</span>
                        {' '}
                        {game.moonPhaseLabel}
                      </div>

                      <div className="mb-2">
                        <span className="font-semibold text-sky-500">In-Game Start Time</span>
                        {' '}
                        <span><TimeAgo date={game.startTime} live={false} /></span>
                      </div>

                      <div className="mb-2">
                        <span className="font-semibold text-sky-500">In-Game Last Update</span>
                        {' '}
                        <span><TimeAgo date={new Date(game.currentTime)} live={false} /></span>
                      </div>

                      <div className="mb-2">
                        <span className="font-semibold text-sky-500">Start Time</span>
                        {' '}
                        <span><TimeAgo date={game.createdAt} live={false} /></span>
                      </div>

                      <div>
                        <span className="font-semibold text-sky-500">Last Update</span>
                        {' '}
                        <span><TimeAgo date={new Date(game.updatedAt)} live={false} /></span>
                      </div>
                    </div>
                  </div>
                </>
              )
              : null
            }

            <div className="mt-4 mb-4">
              <OtherGamesInfo />
            </div>
          </div>

          <div className="col-span-1">
            <AgentsInfo game={game} gameTurn={gameTurn} />
            <HazardsInfo game={game} gameTurn={gameTurn} />
            <TrainsInfo game={game} gameTurn={gameTurn} />
            <StationsInfo game={game} gameTurn={gameTurn} />
          </div>

          <div className="col-span-1">
            <MessagesInfo game={game} gameTurn={gameTurn} messages={messages} />
          </div>
        </div>

        <AboutInfo />
      </div>
    </div>
  );
}