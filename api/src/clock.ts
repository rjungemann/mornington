import dotenv from 'dotenv';
import db from './models'

dotenv.config();

async function main() {
  await db.sync({ force: true });
  // console.log(db.models.Station)
  
  console.info('Ticker started!')
}

main()