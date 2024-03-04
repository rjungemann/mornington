import dotenv from 'dotenv';
import db from './models'
import { seed } from './seeds'

dotenv.config();

async function main() {
  await seed(db)
  process.exit();
}

main()