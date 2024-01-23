'use strict';

import { Association, DataTypes, Sequelize } from 'sequelize';
import { CreationOptional, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";

// TODO: Read from dotenv
const sequelize = new Sequelize('postgres://localhost/mornington_development');

class Station extends Model<
  InferAttributes<Station>,
  InferCreationAttributes<Station>
> {
  // id can be undefined during creation when using `autoIncrement`
  declare id: CreationOptional<number>;

  declare name: string;
  declare label: string;
  declare x: number;
  declare y: number;

  // createdAt can be undefined during creation
  declare createdAt: CreationOptional<Date>;
  // updatedAt can be undefined during creation
  declare updatedAt: CreationOptional<Date>;

  declare static associations: {
    head: Association<Station, Hop>;
    tail: Association<Station, Hop>;
  };
}

class Hop extends Model<
  InferAttributes<Hop>,
  InferCreationAttributes<Hop>
> {
  // id can be undefined during creation when using `autoIncrement`
  declare id: CreationOptional<number>;

  declare label: string;

  // foreign keys are automatically added by associations methods (like Project.belongsTo)
  // by branding them using the `ForeignKey` type, `Project.init` will know it does not need to
  // display an error if ownerId is missing.
  declare headId: ForeignKey<Station['id']>;
  declare tailId: ForeignKey<Station['id']>;

  // createdAt can be undefined during creation
  declare createdAt: CreationOptional<Date>;
  // updatedAt can be undefined during creation
  declare updatedAt: CreationOptional<Date>;
}

Station.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    label: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    x: {
      type: DataTypes.INTEGER
    },
    y: {
      type: DataTypes.INTEGER
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'stations'
  }
);

Hop.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    label: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'hops'
  }
);

Hop.belongsTo(Station, { as: 'head' });
Hop.belongsTo(Station, { as: 'tail' });
Station.hasMany(Hop, { as: 'head' });
Station.hasMany(Hop, { as: 'tail' });

export default sequelize