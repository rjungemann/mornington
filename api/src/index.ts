import express, { Express, NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import db, { Game } from './models'
import { Model, Sequelize } from 'sequelize'
import cors from 'cors';
import { logger } from './logging'

dotenv.config();

const getGameStateByNameAndTurnNumber = (db: Sequelize) => async (name?: string, turnNumber?: number) => {
  const game = name
  ? await db.models.Game.findOne({ order: [['createdAt', 'DESC']], where: { name } })
  : await db.models.Game.findOne({ order: [['createdAt', 'DESC']] })
  if (!game) {
    return
  }
  const gameTurn = await db.models.GameTurn.findOne({
    order: [['turnNumber', 'DESC']],
    where: {
      gameId: game.dataValues.id,
      ...(turnNumber ? { turnNumber } : {})
    }
  })
  if (!gameTurn) {
    return
  }
  const games = await db.models.Game.findAll({
    order: [['createdAt', 'DESC']],
    include: ['agents'],
    limit: 10
  })
  const tn = turnNumber ?? gameTurn.dataValues.turnNumber
  const messages = await db.models.Message.findAll({
    order: [['id', 'DESC']],
    where: {
      gameId: game.dataValues.id,
      turnNumber: [tn, tn - 1, tn - 2]
    }
  })
  return { game, gameTurn, games, messages }
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

  app.get('/games', async (req: Request, res: Response<any, { db: Sequelize }>) => {
    const db = res.locals!.db
    const games = await db.models.Game.findAll({
      order: [['createdAt', 'DESC']],
      include: ['agents'],
      limit: 10
    })
    res.json({ games })
  })

  app.get('/games/latest', async (req: Request, res: Response<any, { db: Sequelize }>) => {
    const db = res.locals!.db
    const name = req.params.name
    const state = await getGameStateByNameAndTurnNumber(db)()
    if (!state) {
      res.status(404).send({})
      return
    }
    res.json(state)
  })

  app.get('/games/:name', async (req: Request, res: Response<any, { db: Sequelize }>) => {
    const db = res.locals!.db
    const name = req.params.name
    const state = await getGameStateByNameAndTurnNumber(db)(name)
    if (!state) {
      res.status(404).send({})
      return
    }
    res.json(state)
  })

  app.get('/games/:name/turns/:turn', async (req: Request, res: Response<any, { db: Sequelize }>) => {
    const db = res.locals!.db
    const name = req.params.name
    const turn = req.params.turn ? parseInt(req.params.turn, 10) : undefined
    const state = await getGameStateByNameAndTurnNumber(db)(name, turn)
    if (!state) {
      res.status(404).send({})
      return
    }
    res.json(state)
  })

  app.listen(port, () => {
    logger.info({ port }, `Server is running at http://localhost:%s`, port);
  })
}

main()