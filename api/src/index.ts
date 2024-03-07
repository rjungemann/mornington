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
    // TODO: Detect finished games and don't show them
    const games = await db.models.Game.findAll()
    res.json({ games })
  })

  app.get('/games/:name', async (req: Request, res: Response<any, { db: Sequelize }>) => {
    const db = res.locals!.db
    const name = req.params.name
    const game = await db.models.Game.findOne({
      order: [['createdAt', 'DESC']],
      where: { name }
    })
    if (game) {
      const gameTurn = await db.models.GameTurn.findOne({
        order: [['turnNumber', 'DESC']],
        where: { gameId: game?.dataValues.id }
      })
      if (gameTurn) {
        const turnNumber = gameTurn.dataValues.turnNumber
        const messages = await db.models.Message.findAll({
          order: [['id', 'DESC']],
          where: {
            gameId: game.dataValues.id,
            turnNumber: [turnNumber, turnNumber - 1, turnNumber - 2]
          }
        })
        res.json({game, gameTurn, messages })
      }
      else {
        res.status(404).json({})
      }
    }
    else {
      res.status(404).json({})
    }
  })

  app.listen(port, () => {
    logger.info({ port }, `Server is running at http://localhost:%s`, port);
  })
}

main()