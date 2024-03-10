import { Model, Sequelize } from "sequelize"
import { Agent, Game, Hazard, Hop, Item, Line, Station, Train } from "./models"

export type ClockContext = {
  db: Sequelize
  game: Model<Game>
  lines: Model<Line>[]
  trains: Model<Train>[]
  hops: Model<Hop>[]
  stations: Model<Station>[]
  agents: Model<Agent>[]
  hazards: Model<Hazard>[]
  items: Model<Item>[]
}