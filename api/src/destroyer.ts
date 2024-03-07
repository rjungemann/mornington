import dotenv from 'dotenv';
import db from './models'
import * as yargs from 'yargs'
import destroyGameByName from './services/destroyGameByName';

dotenv.config();

type Args = {
  name: string
}

async function main() {
  console.info('Importer starting...')

  // Initialize DB
  await db.sync({ force: false });

  const args: Args = yargs
  .option('name', {
    alias: 'n',
    description: 'Game name to create destroy',
    demandOption: true
  })
  .argv as Args;

  await destroyGameByName(db)(args.name)

  process.exit();
}

main()