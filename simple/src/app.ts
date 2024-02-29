import express from "express";
import cors from "cors";
import apiRoutes from "./api";
import {errorResponder} from "./middleware/errorResponder";
import { initDb } from "./models";

export const app = express();

const db = initDb()
app.use(async (req, res, next) => {
  res.locals.db = await db
  next()
})

app.use(cors({origin: '*'}));
app.use(express.json());
app.use(express.urlencoded({extended: true}))

app.get('/', async (req, res) => {
  console.log('GET /')
  try {
    const response = res.locals.db!.authenticate()
    console.log('Connection has been established successfully.');
  } catch(error) {
    console.error('Unable to connect to the database:', error);
  }
  res.status(200).json({ message: 'ok' })
})

app.use('/api/v1', apiRoutes);
app.use(errorResponder);