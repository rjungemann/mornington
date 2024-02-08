import express, { Express, NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import db from './models'
import { Sequelize } from 'sequelize'
import cors from 'cors';
import { findCompleteGameByName } from './services';
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

  app.get('/games/:name', async (req: Request, res: Response<any, { db: Sequelize }>) => {
    const db = res.locals!.db
    const name = req.params.name
    const game = await findCompleteGameByName(db)(name)
    res.send(JSON.stringify({ game }))
  });

  app.listen(port, () => {
    logger.info({ port }, `Server is running at http://localhost:%s`, port);
  });
}

main()