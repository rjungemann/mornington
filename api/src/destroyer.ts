import dotenv from 'dotenv';
import db from './models'
import * as yargs from 'yargs'

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

  await db.transaction(async (t) => {
    const game = (await db.models.Game.findOne({ where: { name: 'one' } }))!

    await db.models.Message.destroy({ where: { gameId: game.dataValues.id } })
    await db.models.Agent.destroy({ where: { gameId: game.dataValues.id } })
    await db.models.Train.destroy({ where: { gameId: game.dataValues.id } })
    await db.models.Hop.destroy({ where: { gameId: game.dataValues.id } })
    await db.models.Line.destroy({ where: { gameId: game.dataValues.id } })
    await db.models.Station.destroy({ where: { gameId: game.dataValues.id } })
    await db.models.GameTurn.destroy({ where: { gameId: game.dataValues.id } })

    await game.destroy()
  })

  process.exit();
}

main()