'use strict';

import { Association, DataTypes, Sequelize } from 'sequelize';
import { CreationOptional, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";

// TODO: Read from dotenv
const sequelize = new Sequelize('postgres://localhost/mornington_development');

class Station extends Model<
  InferAttributes<Station>,
  InferCreationAttributes<Station>
> {
  declare id: CreationOptional<number>;

  declare name: string;
  declare label: string;
  declare x: number;
  declare y: number;

  declare createdAt: CreationOptional<Date>;
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
  declare id: CreationOptional<number>;

  declare label: string;
  declare length: number;

  declare headId: ForeignKey<Station['id']>;
  declare tailId: ForeignKey<Station['id']>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

class Agent extends Model<
  InferAttributes<Agent>,
  InferCreationAttributes<Agent>
> {
  declare id: CreationOptional<number>;

  declare name: string;
  declare label: string;
  declare distance: number;

  declare currentStationId: ForeignKey<Station['id']>;
  declare currentHopId: ForeignKey<Hop['id']>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare static associations: {
    currentStation: Association<Agent, Station>;
    currentHop: Association<Agent, Hop>;
  };
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
    length: {
      type: DataTypes.INTEGER
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'hops'
  }
);

Agent.init(
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
    distance: {
      type: DataTypes.INTEGER
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'agents'
  }
);

Station.hasMany(Hop, { as: 'head' });
Station.hasMany(Hop, { as: 'tail' });
Station.hasMany(Agent, { as: 'currentStation' });
Hop.belongsTo(Station, { as: 'head' });
Hop.belongsTo(Station, { as: 'tail' });
Hop.hasMany(Agent, { as: 'currentHop' });
Agent.belongsTo(Station, { as: 'currentStation' });
Agent.belongsTo(Hop, { as: 'currentHop' });

export default sequelize