import express, { Express, NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import db from './models'
import { Sequelize } from 'sequelize'
import cors from 'cors';

dotenv.config();

async function main() {
  await db.sync({ force: true });
  // console.log(db.models.Station)

  const app: Express = express();
  const port = process.env.PORT || 3000;

  app.use(cors())

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.db = db;
    next();
  })

  app.get('/', (req: Request, res: Response) => {
    res.send('OK');
  });

  app.get('/games/:id', async (req: Request, res: Response<any, { db: Sequelize }>) => {
    const db = res.locals!.db
    const gameId = req.params.id
    const stations = await db.models.Station.findAll();
    const hops = await db.models.Hop.findAll();
    const trains = await db.models.Train.findAll();
    const agents = await db.models.Agent.findAll();
    res.send(JSON.stringify({ gameId, stations, hops, trains, agents }));
  });

  app.listen(port, () => {
    console.info(`[server]: Server is running at http://localhost:${port}`);
  });
}

main()