const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const setupImport = require('import');

const socketService = require('./socket.service');
const { recordModel } = require('./record.model');
const { datasetModel } = require('./dataset.model');

const app = express();
app.use(express.json());

const httpServer = http.createServer(app);
const io = socketService.listen(httpServer);

const {
  importsRouter,
  importProcessesRouter
} = setupImport(io, recordModel, datasetModel);

app.use('/imports', importsRouter.router);
app.use('/import-processes', importProcessesRouter.router);

const PORT = 3000;
const MONGO_URL = 'mongodb+srv://yaroslavrodz:rHj14oOORNKfH5NW@cluster0.khhiqlb.mongodb.net/?retryWrites=true&w=majority';

async function start() {
    try {
      await mongoose.connect(MONGO_URL);
      httpServer.listen(PORT, () =>
        console.log(`Server listening on port: ${PORT}`)
      );
    } catch (error) {
      console.error(error);
    }
  }
  
  start();
