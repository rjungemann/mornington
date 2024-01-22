'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Hop extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.Hop.belongsTo(models.Station)
    }
  }
  Hop.init({
    head: DataTypes.INTEGER,
    tail: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Hop',
  });
  return Hop;
};