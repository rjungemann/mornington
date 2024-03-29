'use client'

import { formatTime } from "@/helpers/formatTime"

const MessageInfo = ({ game, gameTurn, message }: { game: GameResponse, gameTurn: GameTurnResponse, message: MessageResponse }) => {
  return (
    <>
      <span className="text-blue-400 opacity-80">
        #{message.turnNumber}
      </span>
      {' '}
      <span suppressHydrationWarning={true} className="opacity-60">
        {formatTime(new Date(message.currentTime))}
      </span>
      {' '}
      <span className="opacity-80">{message.message}</span>
    </>
  )
}

const MessagesInfo = ({ game, gameTurn, messages }: { game: GameResponse, gameTurn: GameTurnResponse, messages: MessageResponse[] }) => {
  return (
    <>
      <h2 className="text-2xl text-blue-500 font-semibold mt-4 mb-4">Play-By-Play</h2>
      <p className="text-sm mb-4 bg-slate-800 text-slate-200 p-2 opacity-80">
        <span className="font-bold text-blue-500">Note:</span> Events are listed most recent first, according to in-game time.
      </p>
      {
        messages.length > 0
        ? (
          <ul className="mb-4 text-sm">
            {messages.map((message: MessageResponse, i) => (
              <li key={i} className="mb-1">
                <MessageInfo message={message} game={game} gameTurn={gameTurn} />
              </li>
            ))}
          </ul>
        )
        : (
          <div className="mb-4 opacity-80 text-sm pb-2">
            No events to display at this time.
          </div>
        )
      }
    </>
  )
}

export { MessagesInfo }