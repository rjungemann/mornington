'use client'

import { Graph } from '@/components/graph'
import { useGraphOptions } from '@/hooks/useGraphOptions'
import { Navigation } from './navigation'
import { AgentsInfo } from './gameboard/AgentsInfo'
import { HazardsInfo } from './gameboard/HazardsInfo'
import { TrainsInfo } from './gameboard/TrainsInfo'
import { StationsInfo } from './gameboard/StationsInfo'
import { MessagesInfo } from './gameboard/MessagesInfo'
import { AboutInfo } from './gameboard/AboutInfo'
import { OtherGamesInfo } from './gameboard/OtherGamesInfo'
import { formatTime } from '@/helpers/formatTime'
import Link from 'next/link'
import Image from 'next/image'
import rewind from '../app/rewind.svg'
import backward from '../app/backward.svg'
import forward from '../app/forward.svg'
import fastForward from '../app/fast-forward.svg'
import { useGameHook } from '@/hooks/useGameHook'

const BackForwardButtons = ({ game, gameTurn }: { game: GameResponse, gameTurn: GameTurnResponse }) => {
  return (
    <div className="mt-2 mb-2 text-sm flex justify-between">
      <span>
        {
          gameTurn.turnNumber > 1
          ? (
            <>
              <Link className="font-semibold text-lime-400 mr-2 opacity-80 hover:opacity-100" href={`/games/${gameTurn.name}/turns/1`}>
                <Image priority src={rewind} alt="Rewind" className="inline-block" style={{ position: 'relative', top: '-1px', width: 'auto', height: '2em', aspectRatio: 1, filter: 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(48deg) brightness(128%) contrast(119%)' }} />
              </Link>

              <Link className="font-semibold text-lime-400 opacity-80 hover:opacity-100" href={`/games/${gameTurn.name}/turns/${gameTurn.turnNumber - 1}`}>
                <Image priority src={backward} alt="Back" className="inline-block" style={{ position: 'relative', top: '-1px', width: 'auto', height: '1.6em', aspectRatio: 1, filter: 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(48deg) brightness(128%) contrast(119%)' }} />
              </Link>
            </>
          )
          : (
            <>
              <span className="font-semibold mr-2 opacity-80">
                <Image priority src={rewind} alt="Rewind" className="inline-block" style={{ position: 'relative', top: '-1px', width: 'auto', height: '2em', aspectRatio: 1, filter: 'invert(100%) brightness(90%)' }} />
              </span>

              <span className="font-semibold opacity-80">
                <Image priority src={backward} alt="Backward" className="inline-block" style={{ position: 'relative', top: '-1px', width: 'auto', height: '1.6em', aspectRatio: 1, filter: 'invert(100%) brightness(90%)' }} />
              </span>
            </>
          )
        }
      </span>

      <span>
        {
          gameTurn.turnNumber < game.turnNumber
          ? (
            <>
              <Link className="font-semibold text-lime-400 mr-2 opacity-80 hover:opacity-100" href={`/games/${gameTurn.name}/turns/${gameTurn.turnNumber + 1}`}>
                <Image priority src={forward} alt="Forward" className="inline-block" style={{ position: 'relative', top: '-1px', width: 'auto', height: '1.6em', aspectRatio: 1, filter: 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(48deg) brightness(128%) contrast(119%)' }} />
              </Link>

              <Link className="font-semibold text-lime-400 opacity-80 hover:opacity-100" href={`/games/${gameTurn.name}`}>
                <Image priority src={fastForward} alt="Fast-Forward" className="inline-block" style={{ position: 'relative', top: '-1px', width: 'auto', height: '2em', aspectRatio: 1, filter: 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(48deg) brightness(128%) contrast(119%)' }} />
              </Link>
            </>
          )
          : (
            <>
              <span className="font-semibold mr-2 opacity-80">
                <Image priority src={forward} alt="Forward" className="inline-block" style={{ position: 'relative', top: '-1px', width: 'auto', height: '1.6em', aspectRatio: 1, filter: 'invert(100%) brightness(90%)' }} />
              </span>

              <span className="font-semibold opacity-80">
                <Image priority src={fastForward} alt="Fast-Forward" className="inline-block" style={{ position: 'relative', top: '-1px', width: 'auto', height: '2em', aspectRatio: 1, filter: 'invert(100%) brightness(90%)' }} />
              </span>
            </>
          )
        }
      </span>
    </div>
  )
}

const BasicInfo = ({ game, gameTurn }: { game: GameResponse, gameTurn: GameTurnResponse }) => {
  return (
    <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-2 opacity-80 text-sm">
      <div className="col-span-1">
        <span className="font-semibold text-blue-400">Weather</span>
        {' '}
        {gameTurn.weatherLabel}
      </div>

      <div className="col-span-1">
        <span className="font-semibold text-blue-400">Moon Phase</span>
        {' '}
        {gameTurn.moonPhaseLabel}
      </div>

      <div className="col-span-1">
        <span className="font-semibold text-blue-400">Started</span>
        {' '}
        <span suppressHydrationWarning={true}>{formatTime(new Date(gameTurn.createdAt))}</span>
      </div>

      <div className="col-span-1">
        <span className="font-semibold text-blue-400">Updated</span>
        {' '}
        <span suppressHydrationWarning={true}>{formatTime(new Date(gameTurn.updatedAt))}</span>
      </div>

      <div className="col-span-1">
        <span className="font-semibold text-blue-400">In-Game Started</span>
        {' '}
        <span suppressHydrationWarning={true}>{formatTime(new Date(gameTurn.startTime))}</span>
      </div>

      <div className="col-span-1">
        <span className="font-semibold text-blue-400">In-Game Updated</span>
        {' '}
        <span suppressHydrationWarning={true}>{formatTime(new Date(gameTurn.currentTime))}</span>
      </div>

      <div className="col-span-1">
        <span className="font-semibold text-blue-400">In-Game Duration</span>
        {' '}
        <span>{Math.round((new Date(gameTurn.currentTime).getTime() - new Date(gameTurn.startTime).getTime()) / 60.0)} minutes</span>
      </div>
    </div>
  )
}

export function Gameboard({ context, isPolling }: { context: GameContextData, isPolling: boolean }) {
  const { gameTurn, game, games, messages } = useGameHook({ context, isPolling })
  const graphOptions = useGraphOptions()

  // On each load, choose a message from the current turn
  const currentMessages = messages?.filter((message) => message.turnNumber === gameTurn?.turnNumber) || []
  const currentMessage = currentMessages[0]

  // TODO: Better loading indicator
  if (!gameTurn || !game || !messages) {
    return <></>
  }

  return (
    <div className="sm:m-0 lg:m-2">
      <Navigation />
      
      <div className="p-4 m-2">
        <h1 className="mb-2 font-semibold text-2xl text-blue-500">
          {gameTurn.title}
          {' '}
          <span className="text-slate-200">Turn #{gameTurn.turnNumber}</span>
        </h1>

        <div className="grid sm:grid-cols-1 lg:grid-cols-4 sm:gap-0 lg:gap-4">
          <div className="sm:col-span-1 lg:col-span-2">
            <BackForwardButtons game={game} gameTurn={gameTurn} />
            {
              graphOptions
              ? (
                <div className="border-solid border-2 border-slate-600">
                  <Graph gameTurn={gameTurn} options={graphOptions} />
                </div>
              )
              : null
            }
            {
              currentMessage
              ? (
                <div className="p-4 bg-slate-600 font-semibold text-md">
                  {currentMessage.message}
                </div>
              )
              : null
            }

            <div className="p-4 bg-slate-800 mb-6">
              <BasicInfo game={game} gameTurn={gameTurn} />
            </div>

            <div className="mt-4 mb-4">
              <OtherGamesInfo games={games} />
            </div>
          </div>

          <div className="col-span-1">
            <AgentsInfo game={game} gameTurn={gameTurn} />
            <TrainsInfo game={game} gameTurn={gameTurn} />
            <StationsInfo game={game} gameTurn={gameTurn} />
          </div>

          <div className="col-span-1">
            <HazardsInfo game={game} gameTurn={gameTurn} />
            <MessagesInfo game={game} gameTurn={gameTurn} messages={messages} />
          </div>
        </div>

        <AboutInfo />
      </div>
    </div>
  );
}