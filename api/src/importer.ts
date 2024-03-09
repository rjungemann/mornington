import dotenv from 'dotenv'
import db from './models'
import { readFile } from 'fs/promises';
import * as yargs from 'yargs'
import xml2js from 'xml2js'
import importGameFromSvg from './services/importGameFromSvg';
import { Sequelize } from 'sequelize';

type Args = {
  file: string
}

dotenv.config();

async function main() {
  console.info('Importer starting...')

  // Initialize DB
  await db.sync({ force: false });

  const args: Args = yargs
  .option('file', {
      alias: 'f',
      description: 'Map file to import',
      demandOption: true
  })
  .argv as Args;
  
  await importGameFromSvg(db)(args.file)

  process.exit()
}

main()
