import dotenv from 'dotenv';
import db from './models'
import truncateAllGameData from './services/truncateAllGameData';
import { glob } from 'glob';
import importGameFromSvg from './services/importGameFromSvg';

dotenv.config();

async function main() {
  await truncateAllGameData(db)()

  // TODO: Make this an option
  const paths = await glob('../assets/maps/**/*.svg')
  for (let path of paths) {
    await importGameFromSvg(db)(path)
  }
  
  process.exit();
}

main()