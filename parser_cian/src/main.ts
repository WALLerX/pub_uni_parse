import { connect } from 'mongoose';
import express from 'express';
import routes from './routes';

connect(process.env.MONGODB_CONNSTRING as string,
        {authSource: "admin",
        user: process.env.MONGODB_USERNAME as string,
        pass: process.env.MONGODB_PASSWORD as string}); 

const expressApp = express();
expressApp.use('/', routes);

expressApp.listen(Number(process.env.LISTEN_PORT), String(process.env.LISTEN_HOST), () => {
  console.log(`Server listens http://${process.env.LISTEN_HOST}:${process.env.LISTEN_PORT}`);
});