import express, { Express, NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import db, { Game } from './models'
import { Model, Sequelize } from 'sequelize'
import cors from 'cors';
import { logger } from './logging'

dotenv.config();

async function main() {
  // Initialize DB
  await db.sync({ force: false });

  const app: Express = express();
  const port = process.env.PORT || 3001;

  app.use(cors())

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.db = db;
    next();
  })

  app.get('/', (req: Request, res: Response) => {
    res.send('OK');
  });

  app.get('/games', async (req: Request, res: Response<any, { db: Sequelize }>) => {
    const db = res.locals!.db
    const games = await db.models.Game.findAll({
      order: [['createdAt', 'DESC']],
      include: ['agents'],
      limit: 10
    })
    res.json({ games })
  })

  // Also responds to /games/latest
  app.get('/games/:name', async (req: Request, res: Response<any, { db: Sequelize }>) => {
    const db = res.locals!.db
    const name = req.params.name
    const game = name === 'latest'
    ? await db.models.Game.findOne({ order: [['createdAt', 'DESC']] })
    : await db.models.Game.findOne({ order: [['createdAt', 'DESC']], where: { name } })
    if (!game) {
      res.status(404).json({})
      return
    }
    const gameTurn = await db.models.GameTurn.findOne({
      order: [['turnNumber', 'DESC']],
      where: { gameId: game?.dataValues.id }
    })
    if (!gameTurn) {
      res.status(404).json({})
      return
    }
    const turnNumber = gameTurn.dataValues.turnNumber
    const messages = await db.models.Message.findAll({
      order: [['id', 'DESC']],
      where: {
        gameId: game.dataValues.id,
        turnNumber: [turnNumber, turnNumber - 1, turnNumber - 2]
      }
    })
    res.json({game, gameTurn, messages })
  })

  app.listen(port, () => {
    logger.info({ port }, `Server is running at http://localhost:%s`, port);
  })
}

main()