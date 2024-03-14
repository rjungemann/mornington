import db, { Agent, Game, Hazard, Hop, Item, Line, Station, Train } from '../../models';
import { Model, Op, Sequelize } from 'sequelize';
import { logger } from '../../logging'
import { rollDice } from '../../diceparser';
import { ClockContext } from '../../types';

function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0)// / 4294967296;
  }
}

// NOTE: For performance, Does not save the game! Be sure to save the game after use.
const gameSeededRandom = (game: Model<Game>): number => {
  const generator = mulberry32(game.dataValues.currentSeed)
  const value = generator()
  game.set('currentSeed', value)
  return value / 4294967296;
}

// Skill Check Example
//   you.willpower <= Math.floor(Math.random() * 20.0)
//
// Multiple agents in the same station
// * Roll for initiative
// * Until one or no agents are left:
//   * Each roll for damage (assume 1d6 to start)
//   * If an agent reaches 0 HP, they respawn from a starting point
//   * Agents will not board trains until combat is finished
//
// Agents in combat are handled separately before other agents

async function findRandomPath(source: Model<Station>, destination: Model<Station>, context: ClockContext): Promise<Model<Station>[] | undefined> {
  const { game, lines, trains, hops, stations, agents, hazards, items } = context
  const maxTries = 10
  const maxDepth = 20
  for (let i = 0; i < maxTries; i++) {
    let current: Model<Station> | undefined = source
    let path: Model<Station>[] = []
    while (true) {
      if (path.length > maxDepth) {
        break
      }
      if (!current) {
        break
      }
      path.push(current)
      if (current.dataValues.id === destination.dataValues.id) {
        return path
      }
      const nextHops = hops.filter((hop) => hop.dataValues.headId === current!.dataValues.id)
      const nextHop = nextHops[Math.floor(gameSeededRandom(game) * nextHops.length)]
      if (!nextHop) {
        break
      }
      current = stations
        .filter((station) => !path.some((s) => s.dataValues.id === station.dataValues.id))
        .find((station) => station.dataValues.id === nextHop.dataValues.tailId)
    }
  }
  return
}

export { gameSeededRandom, findRandomPath }