import { connect } from 'mongoose';
import express from 'express';
import path from 'path';

connect(process.env.MONGODB_CONNSTRING as string,
        {authSource: "admin",
        user: process.env.MONGODB_USERNAME as string,
        pass: process.env.MONGODB_PASSWORD as string}); 

const expressApp = express();
expressApp.use(express.static(path.join(__dirname, '../public/')));
expressApp.use('/script',express.static(path.join(__dirname, '../script/')));

expressApp.listen(Number(process.env.LISTEN_PORT), String(process.env.LISTEN_HOST), () => {
  console.log(`Server listens http://${process.env.LISTEN_HOST}:${process.env.LISTEN_PORT}`);
});