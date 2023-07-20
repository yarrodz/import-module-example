const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const session = require('express-session');
const setupImport = require('import');

const socketService = require('./socket.service');
const { recordModel } = require('./record.model');
const { datasetModel } = require('./dataset.model');

const app = express();
app.use(express.json());
app.use(
    cors({
        origin: ['http://localhost:4200'],
        credentials: true
    })
);
app.use(
    session({
        secret: 'secret',
        resave: false,
        saveUninitialized: true
    })
);

const httpServer = http.createServer(app);
const io = socketService.listen(httpServer);

const setupParams = {
    io,
    recordModel,
    datasetModel,
    maxAttempts: 3,
    attemptDelayTime: 1000,
    oAuth2RedirectUri: 'http://localhost:3000/oauth-callback/',
    clientUri: 'http://localhost:4200/'
};
const {
    importsRouter,
    importProcessesRouter,
    oAuth2Router,
    reloadPendingImportProcesses
} = setupImport(setupParams);

app.use('/imports', importsRouter.router);
app.use('/import-processes', importProcessesRouter.router);
app.use('', oAuth2Router.router);

const PORT = 3000;
const MONGO_URL = 'mongodb+srv://yaroslavrodz:rHj14oOORNKfH5NW@cluster0.khhiqlb.mongodb.net/?retryWrites=true&w=majority';

async function start() {
    try {
        await mongoose.connect(MONGO_URL);
        httpServer.listen(PORT, () =>
            console.log(`Server listening on port: ${PORT}`)
        );
        reloadPendingImportProcesses(); //reload all pending processes
    } catch (error) {
        console.error(error);
    }
}

start();