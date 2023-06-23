#### Configure connection string for mongodb and port inside index.js file:

    const PORT = 3000
    const MONGO_URL = mongodb+srv://yaroslavrodz:rHj14oOORNKfH5NW@cluster0.khhiqlb.mongodb.net/?retryWrites=true&w=majority

#### Install packages:

```
npm i
```

#### Install import-1.0.0.tgz package (this is a package for importing data from databases):

```
npm i ./import-1.0.0.tgz
```

#### From this package we import one function setupImport

    const {
        importsRouter,
        importProcessesRouter
    } = setupImport(io, recordModel, datasetModel);

    app.use('/imports', importsRouter.router);
    app.use('/import-processes', importProcessesRouter.router);

it accepts socket.io instance, mongoose models for record and dataset
returns router for imports and router for import processes 

#### Start server:

    npm run start


##### This is postman collection of requests that works with external postrgresql database 
##### Open Postman, click on Import, choose 'Link' and paste the link

    https://api.postman.com/collections/27480704-b1ed5369-09fc-41ac-8e7d-eb5503c3cda4?access_key=PMAT-01H3MD7Z5JGD9WKY5ZWD417YK7


#### There are 12 http requests and one socket.io request:

#### Socket.io request for receiving import process
    There is currently no way to share a socket.io request in Postman, so it cannot be added to a Postman collection. I have tested it using a socket.io request in Postman.

    First, we need to connect to the socket.
    http://localhost:3000/
    Next, we need to send a 'join' event including the processId of the import that has executed (646cd1accef0e54e78f8aec0).
    And we need to listen to event 'importProcess'
    We will receive updated import process when it changes.
   


#### Create import request
    POST http://localhost:3000/imports/
    body:
    {
        "unit": "646cd1accef0e54e78f8aec0", --- can be any mongodb ObjectId
        "source": "PostgreSQL",
        "database": {
            "connection": { --- connection parametres
                "host": "snuffleupagus.db.elephantsql.com",
                "port": 5432,
                "username": "xbjpfeyi",
                "password": "YDLqCtSmFNp_MEdcMW6Kd12Fv7BUDbhZ",
                "database": "xbjpfeyi"
            },
            "table": "operations", --- table from where datasets are imported
            "idColumn": "id" --- name of id column of the table
        }
    }
    returns: id of created import and information about columns(name and type), will not create import, if failed to get columns(if user provided wrong parametres). There is another create request for importing data from custom select in postman request collection. In case of custom select, we must not allow the addition of ORDER BY, OFFSET, LIMIT, ROWS FETCH NEXT, and ROWS ONLY to the custom select. Or suggest user to not to do that.

#### Connect request. when import created we can receive columns again. 
    POST http://localhost:3000/imports/connect/
    body: 
    {
        "id": "6495a5523eec96f023f31ab8" --- id of import
    }
    returns id of import and columns from table(or custom select).

#### Set fields request. when import created and we have columns, we can can set fields for import. 
    POST http://localhost:3000/imports/setFields
    body:
    {
        "id": "6495a8d53eec96f023f4fe5c",
        "fields": [
            {
                "feature": {
                    "name": "number",
                    "type": "number",
                    "_id": "64835bd65cafe862fc0d323a"
                },
                "source": "id"
            },
            {
                "feature": {
                    "name": "name",
                    "type": "text",
                    "_id": "64835bd65cafe862fc0d323a"
                },
                "source": "name"
            },
            {
                "feature": {
                    "name": "long-text",
                    "type": "long-text",
                    "_id": "64835bd65cafe862fc0d323a"
                },
                "source": "name"
            },
            {
                "feature": {
                    "name": "time",
                    "type": "time",
                    "_id": "64835bd65cafe862fc0d323b"
                },
                "source": "time"
            },
            {
                "feature": {
                    "name": "date",
                    "type": "date",
                    "_id": "64835bd65cafe862fc0d323b"
                },
                "source": "date"
            },
            {
                "feature": {
                    "name": "datetime",
                    "type": "datetime",
                    "_id": "64835bd65cafe862fc0d323b"
                },
                "source": "datetime"
            }
        ]
    }
    returns: import with created fields

#### Start import request. Once we've configured the fields for importing, we can start the import.

    POST http://localhost:3000/imports/start
    body:
    {
        "id": "648361be35867ac7d6141bec", - id of import
    }
    returns: id of created process. We send this processId in socket.io request.

It generates an import process that stores information about the execution of the import process which can be observed in the 'importprocesses' table or socket.io request. During import, the properties 'processedDatasetsCount' and 'transferredDatasetsCount' increase their values. The import process has a status that can be 'Pending', 'Paused', 'Complete' or 'Failed'. The result of the import process is transferred datasets and records which can be viewed in the tables. In case any error occurs during import, there are limited attempts(5) that will retry to reload the import every period of time(5 seconds). Once all attempts have been exhausted, the process status will be set to "Failed", and an error message will be set.

#### Pause import process request.
    post http://localhost:3000/imports/pause
    body:
    {
        "id": "648361be35867ac7d6141bec", -- id of process
    }
    returns true

We can pause an import. The status of the import process will change to "Paused", and import execution will stop. We can pause only pending import process.



#### Reload import process
    POST http://localhost:3000/imports/reload
    body:
    {
        "id": "648361be35867ac7d6141bec", -- id of process
    }
    returns: id of import process

We can reload that import. We have to pass the id of the paused process. The process status will be changed to 'Pending' and import will be reloaded from the point it paused. Only paused process can be reloaded.

#### Retry import process
    POST http://localhost:3000/imports/retry
    body:
    {
        "id": "648361be35867ac7d6141bec", -- id of process
    }
    returns: id of import process

We can create a situation where the password or table name in the database configuration is invalid by editing the import instance in the table. Then import process will be failed.

Then we can modify them to their correct values and send a retry request. This will reset the attempts and error message, and start import again.


#### Get imports list
    GET http://localhost:3000/imports/646cd1accef0e54e78f8aec0
    returns: List of imports by unitId


#### Get import processes list
    GET http://localhost:3000/import-processes/646cd1accef0e54e78f8aec0
    returns: List of import processes by unitId

#### Update import
    PUT http://localhost:3000/imports/
    body: 
        {
            "id": "6495a5523eec96f023f31ab8",
            "impt": {
                "unit": "646cd1accef0e54e78f8aec0",
                "source": "PostgreSQL",
                "database": {
                    "connection": {
                        "host": "snuffleupagus.db.elephantsql.com",
                        "port": 5432,
                        "username": "xbjpfeyi",
                        "password": "YDLqCtSmFNp_MEdcMW6Kd12Fv7BUDbhZ",
                        "database": "xbjpfeyi"
                    },
                    "table": "operations",
                    "idColumn": "id"
                }
            }
        }
This is working like create import. It returns id of updated import and columns. If the user provides incorrect parameters, they will not be able to receive the columns and the import will not be updated.

 #### Delete import 
    DELETE http://localhost:3000/imports/6492bed9d97abb8d17209d67
    returns: true

#### Delete import process
    DELETE http://localhost:3000/import-processes/64959d7e9075e58b36f8e2cb
    retuns: true
We cannot delete pending import process, we need to pause it before delete.
