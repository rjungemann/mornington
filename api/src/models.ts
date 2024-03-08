'use strict';

import { Association, DataTypes, Sequelize, CreationOptional, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
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

// ------------------
// Class Declarations
// ------------------

export class Game extends Model<
  InferAttributes<Game>,
  InferCreationAttributes<Game>
> {
  declare id: CreationOptional<number>;

  declare name: string;
  declare title: string;
  declare label: string;
  declare turnNumber: number;
  declare finished: boolean;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare static associations: {
    gameTurns: Association<Game, GameTurn>;
    messages: Association<Game, GameTurn>;
    stations: Association<Game, Station>;
    hops: Association<Game, Hop>;
    trains: Association<Game, Train>;
    agents: Association<Game, Agent>;
    hazards: Association<Game, Hazard>;
  };
}

export class GameTurn extends Model<
  InferAttributes<GameTurn>,
  InferCreationAttributes<GameTurn>
> {
  declare id: CreationOptional<number>;
  declare turnNumber: number;
  declare data: any;

  declare gameId: ForeignKey<Game['id']>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export class Message extends Model<
  InferAttributes<Message>,
  InferCreationAttributes<Message>
> {
  declare id: CreationOptional<number>;
  declare turnNumber: number;
  declare message: string;

  declare gameId: ForeignKey<Game['id']>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export class Station extends Model<
  InferAttributes<Station>,
  InferCreationAttributes<Station>
> {
  declare id: CreationOptional<number>;

  declare name: string;
  declare title: string;
  declare label: string;
  declare virtual: boolean;
  declare start: boolean;
  declare end: boolean;
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

export class Line extends Model<
  InferAttributes<Line>,
  InferCreationAttributes<Line>
> {
  declare id: CreationOptional<number>;

  declare name: string;
  declare title: string;
  declare label: string;
  declare color: string;

  declare gameId: ForeignKey<Game['id']>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare static associations: {
    hops: Association<Line, Hop>;
    trains: Association<Line, Train>;
  };
}

export class Hop extends Model<
  InferAttributes<Hop>,
  InferCreationAttributes<Hop>
> {
  declare id: CreationOptional<number>;

  declare name: string;
  declare label: string;
  declare length: number;

  declare gameId: ForeignKey<Game['id']>;
  declare headId: ForeignKey<Station['id']>;
  declare tailId: ForeignKey<Station['id']>;
  declare lineId: ForeignKey<Line['id']>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare static associations: {
    trains: Association<Hop, Train>;
    hazards: Association<Game, Hazard>;
  };
}

export class Train extends Model<
  InferAttributes<Train>,
  InferCreationAttributes<Train>
> {
  declare id: CreationOptional<number>;

  declare name: string;
  declare title: string;
  declare label: string;
  declare color: string;
  declare distance: number;
  declare speed: number;
  declare maxWaitTime: number;
  declare currentWaitTime: number;

  declare gameId: ForeignKey<Game['id']>;
  declare stationId: ForeignKey<Station['id']> | null;
  declare hopId: ForeignKey<Hop['id']> | null;
  declare lineId: ForeignKey<Line['id']>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare static associations: {
    agents: Association<Train, Agent>;
  };
}

export class Agent extends Model<
  InferAttributes<Agent>,
  InferCreationAttributes<Agent>
> {
  declare id: CreationOptional<number>;

  declare name: string;
  declare title: string;
  declare label: string;
  declare color: string;
  declare strength: number;
  declare dexterity: number;
  declare willpower: number;
  declare currentHp: number;
  declare maxHp: number;
  declare initiative: number;
  declare timeout: number;

  declare gameId: ForeignKey<Game['id']>;
  declare stationId: ForeignKey<Station['id']> | null;
  declare trainId: ForeignKey<Hop['id']> | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export class Hazard extends Model<
  InferAttributes<Hazard>,
  InferCreationAttributes<Hazard>
> {
  declare id: CreationOptional<number>;

  declare name: string;
  declare title: string;
  declare label: string;
  declare color: string;
  declare kind: string;
  declare age: number;
  declare distance: number;

  declare gameId: ForeignKey<Game['id']>;
  declare hopId: ForeignKey<Hop['id']> | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

// --------------------
// Model Initialization
// --------------------

Game.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    title: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    label: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    turnNumber: {
      type: new DataTypes.INTEGER,
      allowNull: false
    },
    finished: {
      type: new DataTypes.BOOLEAN,
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

GameTurn.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    turnNumber: {
      type: new DataTypes.INTEGER,
      allowNull: false
    },
    data: {
      type: new DataTypes.JSON(),
      allowNull: false
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'gameTurns'
  }
);

Message.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    turnNumber: {
      type: new DataTypes.INTEGER,
      allowNull: false
    },
    message: {
      type: new DataTypes.TEXT,
      allowNull: false
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'messages'
  }
);

Station.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    title: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    label: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    virtual: {
      type: DataTypes.BOOLEAN
    },
    start: {
      type: DataTypes.BOOLEAN
    },
    end: {
      type: DataTypes.BOOLEAN
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

Line.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    title: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    label: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    color: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'lines'
  }
);

Hop.init(
  {
    id: {
      type: DataTypes.INTEGER,
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
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    title: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    label: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    color: {
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
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    title: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    label: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    color: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    strength: {
      type: new DataTypes.INTEGER,
      allowNull: false
    },
    dexterity: {
      type: new DataTypes.INTEGER,
      allowNull: false
    },
    willpower: {
      type: new DataTypes.INTEGER,
      allowNull: false
    },
    currentHp: {
      type: new DataTypes.INTEGER,
      allowNull: false
    },
    maxHp: {
      type: new DataTypes.INTEGER,
      allowNull: false
    },
    initiative: {
      type: new DataTypes.INTEGER,
      allowNull: false
    },
    timeout: {
      type: new DataTypes.INTEGER,
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

Hazard.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    title: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    label: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    color: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    kind: {
      type: new DataTypes.STRING(128),
      allowNull: false
    },
    age: {
      type: new DataTypes.INTEGER,
      allowNull: false
    },
    distance: {
      type: new DataTypes.INTEGER,
      allowNull: false
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'hazards'
  }
);

// ------------------
// Model Associations
// ------------------

Game.hasMany(GameTurn, { as: 'gameTurns', foreignKey: 'gameId' });
Game.hasMany(Message, { as: 'messages', foreignKey: 'gameId' });
Game.hasMany(Station, { as: 'stations', foreignKey: 'gameId' });
Game.hasMany(Line, { as: 'lines', foreignKey: 'gameId' });
Game.hasMany(Hop, { as: 'hops', foreignKey: 'gameId' });
Game.hasMany(Train, { as: 'trains', foreignKey: 'gameId' });
Game.hasMany(Agent, { as: 'agents', foreignKey: 'gameId' });
Game.hasMany(Hazard, { as: 'hazards', foreignKey: 'gameId' });
GameTurn.belongsTo(Game, { as: 'game', foreignKey: 'gameId' });
Message.belongsTo(Game, { as: 'game', foreignKey: 'gameId' });
Line.hasMany(Hop, { as: 'hops', foreignKey: 'lineId' });
Line.hasMany(Train, { as: 'trains', foreignKey: 'lineId' });
Line.belongsTo(Game, { as: 'game', foreignKey: 'gameId' })
Station.hasMany(Hop, { as: 'headHops', foreignKey: 'headId' });
Station.hasMany(Hop, { as: 'tailHops', foreignKey: 'tailId' });
Station.hasMany(Train, { as: 'trains', foreignKey: 'stationId' });
Station.hasMany(Agent, { as: 'agents', foreignKey: 'stationId' });
Station.belongsTo(Game, { as: 'game', foreignKey: 'gameId' });
Hop.hasMany(Train, { as: 'trains', foreignKey: 'hopId' });
Hop.hasMany(Hazard, { as: 'hazards', foreignKey: 'hopId' });
Hop.belongsTo(Station, { as: 'head', foreignKey: 'headId' });
Hop.belongsTo(Station, { as: 'tail', foreignKey: 'tailId' });
Hop.belongsTo(Line, { as: 'line', foreignKey: 'lineId' });
Hop.belongsTo(Game, { as: 'game', foreignKey: 'gameId' })
Train.hasMany(Agent, { as: 'agents', foreignKey: 'trainId' });
Train.belongsTo(Station, { as: 'station', foreignKey: 'stationId' });
Train.belongsTo(Hop, { as: 'hop', foreignKey: 'hopId' });
Train.belongsTo(Line, { as: 'line', foreignKey: 'lineId' });
Train.belongsTo(Game, { as: 'game', foreignKey: 'gameId' });
Agent.belongsTo(Station, { as: 'station', foreignKey: 'stationId' });
Agent.belongsTo(Train, { as: 'train', foreignKey: 'trainId' });
Agent.belongsTo(Game, { as: 'game', foreignKey: 'gameId' });
Hazard.belongsTo(Game, { as: 'game', foreignKey: 'gameId' });
Hazard.belongsTo(Hop, { as: 'hop', foreignKey: 'hopId' });

export default sequelize