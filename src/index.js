import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import routes from './routes';
import database from './config/database';
import {
  appErrorHandler,
  genericErrorHandler,
  notFound
} from './middlewares/error.middleware';
// import logger, { logStream } from './config/logger';

import morgan from 'morgan';

const app = express();
const host = process.env.APP_HOST;
const port = process.env.APP_PORT;
const api_version = process.env.API_VERSION;

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'x-fcm-token'
    ],
    credentials: false
  })
);

app.options('*', cors());
// app.use(helmet({
//   crossOriginResourcePolicy: false,
//   crossOriginEmbedderPolicy: false,
//   crossOriginOpenerPolicy: false
// }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// app.use(morgan('combined', { stream: logStream }));

database();
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(`/api/${api_version}`, routes());
app.use(appErrorHandler);
app.use(genericErrorHandler);
app.use(notFound);

app.listen(port, () => {
  console.log(`Server started at ${host}:${port}/api/${api_version}/`);
});

export default app;
