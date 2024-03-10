import dotenv from 'dotenv';
import db, { Game } from './models';
import { Model } from 'sequelize';
import { logger } from './logging'
import tickGame from './services/tickGame';

dotenv.config();

const runOnce: boolean = Boolean( process.env.RUN_ONCE && process.env.RUN_ONCE.toLowerCase() !== 'false' )
const parallel: boolean = Boolean( process.env.PARALLEL && process.env.PARALLEL.toLowerCase() !== 'false' )
const tickInterval: number = parseInt(process.env.TICK_INTERVAL || '5000', 10)

async function tick() {
  logger.info('Ticker starting...')

  // Initialize DB
  await db.sync({ force: false });

  logger.info('Ticker started!...')
  const games: Model<Game>[] = await db.models.Game.findAll({
    where: { finished: false }
  })
  if (parallel) {
    const promises = games.map((game) => tickGame(db)(game))
    await Promise.allSettled(promises)
  }
  else {
    for (let game of games) {
      await tickGame(db)(game)
    }
  }
  logger.info('Ticker finished!')
}

const timeout = (interval: number) => new Promise((res) => setTimeout(res, interval))

async function main() {
  while (true) {
    await tick()
    if (runOnce) {
      break;
    }
    logger.info('Ticker will tick again in %sms!', tickInterval)
    await timeout(tickInterval)
  }
  process.exit()
}

main()