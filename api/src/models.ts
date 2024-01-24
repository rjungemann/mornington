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
    heads: Association<Station, Hop>;
    tails: Association<Station, Hop>;
    agents: Association<Station, Agent>;
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

  declare static associations: {
    trains: Association<Station, Train>;
    agents: Association<Station, Agent>;
  };
}

class Train extends Model<
  InferAttributes<Train>,
  InferCreationAttributes<Train>
> {
  declare id: CreationOptional<number>;

  declare name: string;
  declare label: string;
  declare distance: number;
  declare speed: number;
  declare maxWaitTime: number;
  declare currentWaitTime: number;

  declare stationId: ForeignKey<Station['id']>;
  declare hopId: ForeignKey<Hop['id']>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare static associations: {
    agents: Association<Station, Agent>;
  };
}

class Agent extends Model<
  InferAttributes<Agent>,
  InferCreationAttributes<Agent>
> {
  declare id: CreationOptional<number>;

  declare name: string;
  declare label: string;

  declare stationId: ForeignKey<Station['id']>;
  declare trainId: ForeignKey<Hop['id']>;

  declare createdAt: CreationOptional<Date>;
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

Train.init(
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
      type: DataTypes.INTEGER,
      allowNull: false
    },
    speed: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    maxWaitTime: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    currentWaitTime: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'trains'
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
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'agents'
  }
);

Station.hasMany(Hop, { as: 'heads', sourceKey: 'id', foreignKey: 'headId' });
Station.hasMany(Hop, { as: 'tails', sourceKey: 'id', foreignKey: 'tailId' });
Station.hasMany(Train, { as: 'station', sourceKey: 'id', foreignKey: 'stationId' });
Station.hasMany(Agent, { as: 'agent', sourceKey: 'id', foreignKey: 'agentId' });
Hop.hasMany(Train, { as: 'hop', sourceKey: 'id', foreignKey: 'hopId' });
Hop.belongsTo(Station, { as: 'head' });
Hop.belongsTo(Station, { as: 'tail' });
Train.hasMany(Agent, { as: 'agent', sourceKey: 'id', foreignKey: 'agentId' });
Train.belongsTo(Station, { as: 'station' });
Train.belongsTo(Hop, { as: 'hop' });
Agent.belongsTo(Station, { as: 'station' });
Agent.belongsTo(Train, { as: 'train' });

export default sequelize