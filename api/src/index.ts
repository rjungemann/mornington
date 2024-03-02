import express, { Express, NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import db, { Game } from './models'
import { Model, Sequelize } from 'sequelize'
import cors from 'cors';
import { logger } from './logging'

dotenv.config();

function getLatestGameTurnByName(db: Sequelize, name: string) {
  return db.models.GameTurn.findOne({
    include: { model: Game, as: 'game', where: { name } },
    order: [['createdAt', 'DESC']]
  })
}

function serializeGameTurn(gameTurn: Model<any, any>) {
  const gameData = gameTurn!.dataValues.data
  return JSON.stringify({ game: gameData })
}

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

  app.get('/games/:name', async (req: Request, res: Response<any, { db: Sequelize }>) => {
    const db = res.locals!.db
    const name = req.params.name
    const gameTurn = await getLatestGameTurnByName(db, name)
    if (!gameTurn) {
      res.send({ game: null })
    } else {
      res.send(serializeGameTurn(gameTurn))
    }
  });

  app.listen(port, () => {
    logger.info({ port }, `Server is running at http://localhost:%s`, port);
  });
}

main()