'use client'

import TimeAgo from 'react-timeago'

const MessageInfo = ({ game, gameTurn, message }: { game: GameResponse, gameTurn: GameTurnResponse, message: MessageResponse }) => {
  return (
    <>
      <span className="text-sky-400">
        #{message.turnNumber}
      </span>
      {' '}
      <span className="opacity-80">
        <TimeAgo date={message.currentTime} live={false} />
      </span>
      {' '}
      {message.message}
    </>
  )
}

const MessagesInfo = ({ game, gameTurn, messages }: { game: GameResponse, gameTurn: GameTurnResponse, messages: MessageResponse[] }) => {
  const groupedMessages: Record<number, MessageResponse[]> = messages?.reduce((hash: Record<number, MessageResponse[]>, message: MessageResponse) => {
    hash[message.turnNumber] ??= []
    hash[message.turnNumber] = [...hash[message.turnNumber], message]
    return hash
  }, {}) || []
  const turnNumbers: number[] = Object.keys(groupedMessages).map((n) => parseInt(n, 10)).sort().reverse()

  return (
    <>
      <h2 className="text-xl text-sky-500 font-semibold mt-4 mb-4">Play-By-Play</h2>
      <p className="text-xs mb-4 bg-slate-800 text-slate-200 p-2 opacity-80">
        <span className="font-bold text-sky-500">Note:</span> Events are listed most recent first.
      </p>
      <div className="mb-4 divide-y-2 divide-slate-600">
        {turnNumbers.map((turnNumber, turnIndex) => {
          return (
            <ul key={turnIndex} className="opacity-80 text-xs pb-2 pt-3 first:pt-0">
              {messages.map((message: MessageResponse, i) => (
                <li key={i} className="mb-1">
                  <MessageInfo message={message} game={game} gameTurn={gameTurn} />
                </li>
              ))}
            </ul>
          )
        })}
      </div>
    </>
  )
}

export { MessagesInfo }