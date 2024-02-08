'use strict';

import { Association, DataTypes, Sequelize } from 'sequelize';
import { CreationOptional, ForeignKey, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import cls from 'cls-hooked'
import { logger } from './logging'

// All DB calls inside a transaction will default to adhering to that transaction.
//
// https://sequelize.org/docs/v6/other-topics/transactions/#automatically-pass-transactions-to-all-queries
//
const namespace = cls.createNamespace('default');
Sequelize.useCLS(namespace);

// TODO: Read from dotenv
const sequelize = new Sequelize('postgres://localhost/mornington_development', {
  logging: (sql, timing) => {
    logger.debug(sql, typeof timing === 'number' ? `Elapsed time: ${timing}ms` : '')
  }
});

export class Game extends Model<
  InferAttributes<Game>,
  InferCreationAttributes<Game>
> {
  declare id: CreationOptional<number>;

  declare name: string;
  declare label: string;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare static associations: {
    stations: Association<Game, Station>;
    hops: Association<Game, Hop>;
    trains: Association<Game, Train>;
    agents: Association<Game, Agent>;
  };
}

export class Station extends Model<
  InferAttributes<Station>,
  InferCreationAttributes<Station>
> {
  declare id: CreationOptional<number>;

  declare name: string;
  declare label: string;
  declare x: number;
  declare y: number;

  declare gameId: ForeignKey<Game['id']>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare static associations: {
    heads: Association<Station, Hop>;
    tails: Association<Station, Hop>;
    agents: Association<Station, Agent>;
  };
}

export class Hop extends Model<
  InferAttributes<Hop>,
  InferCreationAttributes<Hop>
> {
  declare id: CreationOptional<number>;

  declare label: string;
  declare length: number;

  declare gameId: ForeignKey<Game['id']>;
  declare headId: ForeignKey<Station['id']>;
  declare tailId: ForeignKey<Station['id']>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare static associations: {
    trains: Association<Station, Train>;
  };
}

export class Train extends Model<
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

  declare gameId: ForeignKey<Game['id']>;
  declare stationId: ForeignKey<Station['id']>;
  declare hopId: ForeignKey<Hop['id']>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare static associations: {
    agents: Association<Station, Agent>;
  };
}

export class Agent extends Model<
  InferAttributes<Agent>,
  InferCreationAttributes<Agent>
> {
  declare id: CreationOptional<number>;

  declare name: string;
  declare label: string;

  declare gameId: ForeignKey<Game['id']>;
  declare stationId: ForeignKey<Station['id']>;
  declare trainId: ForeignKey<Hop['id']>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Game.init(
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
    tableName: 'games'
  }
);

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

Game.hasMany(Station, { as: 'stations', foreignKey: 'gameId' });
Game.hasMany(Hop, { as: 'hops', foreignKey: 'gameId' });
Game.hasMany(Train, { as: 'trains', foreignKey: 'gameId' });
Game.hasMany(Agent, { as: 'agents', foreignKey: 'gameId' });
Station.hasMany(Hop, { as: 'headHops', foreignKey: 'headId' });
Station.hasMany(Hop, { as: 'tailHops', foreignKey: 'tailId' });
Station.hasMany(Train, { as: 'trains', foreignKey: 'stationId' });
Station.hasMany(Agent, { as: 'agents', foreignKey: 'stationId' });
Station.belongsTo(Game, { as: 'game', foreignKey: 'gameId' })
Hop.hasMany(Train, { as: 'trains', foreignKey: 'hopId' });
Hop.belongsTo(Station, { as: 'head', foreignKey: 'headId' });
Hop.belongsTo(Station, { as: 'tail', foreignKey: 'tailId' });
Hop.belongsTo(Game, { as: 'game', foreignKey: 'gameId' })
Train.hasMany(Agent, { as: 'agents', foreignKey: 'trainId' });
Train.belongsTo(Station, { as: 'station', foreignKey: 'stationId' });
Train.belongsTo(Hop, { as: 'hop', foreignKey: 'hopId' });
Train.belongsTo(Game, { as: 'game', foreignKey: 'gameId' })
Agent.belongsTo(Station, { as: 'station', foreignKey: 'stationId' });
Agent.belongsTo(Train, { as: 'train', foreignKey: 'trainId' });
Agent.belongsTo(Game, { as: 'game', foreignKey: 'gameId' })

export default sequelize