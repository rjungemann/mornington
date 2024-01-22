import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { createDb } from './db';

dotenv.config();

async function main() {
  const sequelize = createDb();
  
  console.info('Ticker started!')
}

main()