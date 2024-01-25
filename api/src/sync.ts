import dotenv from 'dotenv';
import db from './models'

dotenv.config();

async function main() {
  await db.sync({ force: true });
  process.exit();
}

main()