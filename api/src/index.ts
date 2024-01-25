import express, { Express, NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import db from './models'
import { Sequelize } from 'sequelize'
import cors from 'cors';

dotenv.config();

async function main() {
  await db.sync({ force: false });
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

  app.get('/games/:name', async (req: Request, res: Response<any, { db: Sequelize }>) => {
    const db = res.locals!.db
    const name = req.params.name
    const game = await db.models.Game.findOne({
      include: [
        { model: db.models.Station, as: 'stations' },
        { model: db.models.Hop, as: 'hops' },
        { model: db.models.Train, as: 'trains' },
        { model: db.models.Agent, as: 'agents' },
      ],
      where: { name }
    })
    res.send(JSON.stringify({ game }))
  });

  app.listen(port, () => {
    console.info(`[server]: Server is running at http://localhost:${port}`);
  });
}

main()