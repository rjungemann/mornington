

import { Sequelize } from "sequelize"

const truncateAllGameData = (db: Sequelize) => async () => {
  await db.query(`truncate games, "gameTurns", stations, lines, hops, trains, agents, hazards, messages`);
}

export default truncateAllGameData