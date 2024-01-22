
const { Sequelize } = require('sequelize');

export async function createDb() {
  const sequelize = new Sequelize('postgres://localhost/mornington_development');

  // try {
  //   await sequelize.authenticate();
  //   console.log('Connection has been established successfully.');
  // } catch (error) {
  //   console.error('Unable to connect to the database:', error);
  // }

  // TODO: `force: false` for production
  await sequelize.sync({ force: true });

  return sequelize;
}