#### Configure connection string for mongodb and port inside index.js file:

    const PORT = 3000
    const MONGO_URL = mongodb+srv://yaroslavrodz:rHj14oOORNKfH5NW@cluster0.khhiqlb.mongodb.net/?retryWrites=true&w=majority

#### Install packages:

```
npm i
```

#### Install import-1.0.0.tgz package (this is a package for importing data from databases and api):

```
npm i ./import-1.0.0.tgz
```

#### From this package we import one function setupImport. 
    const setupParams = {
        io, // Socket.io instanse
        recordModel, // mongoose record model
        datasetModel, // mongoose dataset model
        maxAttempts: 3, // The number of attempts to import will be retried if it fails.
        attemptDelayTime: 1000, // delay before next attempt in milliseconds
        oAuth2RedirectUri: 'http://localhost:3000/oauth-callback/', // OAuth2 callback redirect uri
        clientUri: 'http://localhost:4200/' // Client uri
    };
    const {
        importsRouter,
        importProcessesRouter,
        oAuth2Router, // Contain one route OAuth2 callback
        reloadPendingImportProcesses // When server falls we need to reload all pending processes on restart
    } = setupImport(setupParams);

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

Returns express routers for imports, import processes, OAuth2, function for reloading imoprt processes on server restart.

#### Start server:

    npm run start


#### We cannot use Postman for testing OAuth2 because it does not support redirects from the server. There is a client for testing.

    https://github.com/yarrodz/import-test-client

    npm i

    npm run start

#### It consists of two main components: "Imports" and "Processes".

#### Imports
    Inside the 'imports' component, there are four other components for importing data from Airtable, Notion, Trello, and Postgres.
    They all have hardcoded requests with already provided parameters.
    I will share credentials for the account used that is used for these api.

##### create

    create() {
    const data = {
      "unit": "64835bd65cafe862fc0d323a", --- mongodb ObjectId
      "source": "API", --- import source. 'SQL' or 'API' 
      "api": {
        "method": "GET", --- request method. POST or GET
        "url": "https://api.airtable.com/v0/app21mGIM0s2BEm27/tbl3y4w8RsZO2mhbu", --- request url 
        "responseType": "JSON", --- response type
        "datasetsPath": "data.records", --- datasets are typically not placed in the response directly.
                                            Instead, they are typically nested within the response object.
        "transferType": "Cursor Pagination", --- type of transfer. 'Offset pagination', 'Cursor pagination' or 'Chunk'
        "paginationOptions": { --- Pagination parameters
          "placement": "Query Parameters", --- placement inside request. 'Body' or 'Query parameters'.
          "cursorParameterPath": "data.offset", --- when we use cursor pagination transfer,
                                                    the cursor string is placed inside the previous request response.
                                                    We utilize the cursor to include it in the next request
                                                    and retrieve the next set of data.
          "cursorParameter": "offset", --- cursor parameter name that will be used to include it in request 
          "limitParameter": "maxRecords", --- limit parameter name
          "limitValue": 1000 --- the limitValue does not mean that we receive 1000 per request.
                                 Airtable allows us to receive 100 datasets per request.
                                 Airtable uses this value to determine how many datasets we want to receive in total.
                                 If we specify the number greater than 100 it will include cursor in response.
                                 Mostly other api will use limitValue in default meaning it word.
        },
        "auth": { --- athorization for request  
          "type": "OAuth 2.0", --- type of authorization
          "oauth2": { --- params for oauth2
            "client_id": "3b4f65dc-fb59-49e0-b8d6-28a45364b617",
            "scope": "data.records:read",
            "auth_uri": "https://airtable.com/oauth2/v1/authorize",
            "token_uri": "https://www.airtable.com/oauth2/v1/token",
            "use_code_verifier": true
          },
        }
      },
      "idColumn": "fields.Organization_Id", --- dataset id column path 
      "limitRequestsPerSecond": 1, --- The limit for requests per second that the API allows is 5. However, it never happened on my computer. Transforming and saving 100 datasets in parralel to mongo takes anywhere from half a second to a second.
      "datasetsCount": 1000 --- Count of total datasets
    };

    this.http.post('http://localhost:3000/imports/', data, { withCredentials: true, observe: "response" })
      .subscribe(
        (response) => {
          if (response.status == 201) { --- If we receive a 201 status, the client knows that it needs to redirect to the link provided in the response.
                                            (300 response codes are blocked for some reason)
                                            The OAuth2 Auth Uri is included in the response.
                                            We will be navigated to the Airtable OAuth2 Uri, where we will grant access to use its data.
                                            Then, it will be redirected to the OAuth2 callback endpoint defined on the our server.
                                            Inside the callback function, will be send an additional request to receive the access and refresh tokens and then save them to mongo.
                                            Finally, we will be redirect the client back to the previous page with the provided query parameters.
                                            The client, using ActivatedRoute, will understand that it needs to make the same request, but it is already authorized.
            window.location.href = response.body as string; 
          } else { --- we used simple authorization and received response right away
            console.log('Response from airtable create');
            console.log(response.body);
          }
        },
        (error) => console.log('Error while sending airtable create: ', error.message)
      );
  }

  Response includes columns that are availiable for import and created import id 

##### setFields

    setFields(importId: string) {
    let data = {
      "id": importId, --- id of import for whom we set fields
      "fields": [ --- fields for import
        {
          "feature": { --- feature for that will be imported record
            "name": "Organization_Id", 
            "type": "text",
            "_id": "64835bd65cafe862fc0d323a"
          },
          "source": "fields.Organization_Id" --- source dataset record path
        },
        {
          "feature": {
            "name": "Name",
            "type": "text",
            "_id": "64835bd65cafe862fc0d323a"
          },
          "source": "fields.Name"
        },
        {
          "feature": {
            "name": "Description",
            "type": "text",
            "_id": "64835bd65cafe862fc0d323a"
          },
          "source": "fields.Description"
        },
      ]
    };
    
    this.http.post('http://localhost:3000/imports/setFields', data, { withCredentials: true }).subscribe(
      response => {
        console.log('Response from airtable setFields')
        console.log(response);
      },
      error => {
        console.log('Error while sending airtable  setFields: ', error);
      }
    );
    }

    Response includes import with the setted fields

##### Connect

    connect(importId: string) {
    const data = {
      id: importId
    };
    
    this.http.post('http://localhost:3000/imports/connect/', data, { withCredentials: true, observe: "response" }).subscribe(
      (response) => {
        if (response.status == 201) {
          window.location.href = response.body as string; --- If oauth2 access and refresh token are expired we will be naviated to OAuth2 Auth Uri  
        } else {
          console.log('Response from connect');
          console.log(response.body);
        }
      },
      error => {
        console.log('Error while sending connect: ', error.message);
      }
    );
    }

    Response includes columns that are availiable for import and import id 

##### Start

    start(importId: string) {
      const data = {
      "id": importId
    };
    
    this.http.post('http://localhost:3000/imports/start', data, { withCredentials: true, observe: "response" })
      .subscribe(
        (response) => {
          if (response.status == 201) {
            window.location.href = response.body as string;
          } else {
            console.log('Response from start');
            console.log(response.body);
          }
        },
        error => {
          console.log('Error while sending start: ', error.message);
        }
      );
    } 

    Response will include id of created import process and we can observe the process using websockets
    or in mongo table 'importprocesses'.

    During import, the properties 'processedDatasetsCount' and 'transferredDatasetsCount' increase their values.
    The import process has a status that can be 'Pending', 'Paused', 'Complete' or 'Failed'.
    The result of the import process is transferred datasets and records which can be viewed in the tables.

    For websockets we can use postman.
    First, we need to connect to the socket.
    http://localhost:3000/
    Next, we need to send a 'join' event including the processId of the import that has executed
    646cd1accef0e54e78f8aec0
    And we need to listen to event 'importProcess'
    We will receive updated import process when it changes. 


#### Processes

##### Pause

    pause(processId: string) {
    const data = {
      id: processId
    };
    
    this.http.post('http://localhost:3000/import-processes/pause/', data, { withCredentials: true }).subscribe(
      response => {
        console.log('pause')
        console.log(response);
      },
      error => {
        console.log('Error while sending pause: ', error.message);
      }
    );
    }

    Response includes id of paused process. The import will be stoped.


##### Reload 

    reload(processId: string) {
    const data = {
      "id": processId
    };
    
    this.http.post('http://localhost:3000/import-processes/reload', data, { withCredentials: true, observe: "response" })
      .subscribe(
        (response) => {
          if (response.status == 201) {
            window.location.href = response.body as string;
          } else {
            console.log('Response from reload');
            console.log(response.body);
          }
        },
        error => {
          console.log('Error while sending reload: ', error.message);
        }
      );
    }

    Response includes the id of reloaded process. The import will be reloaded from the point it stopped.

 
 ##### Retry 

    retry(processId: string) {
    const data = {
      "id": processId
    };
    
    this.http.post('http://localhost:3000/import-processes/retry', data, { withCredentials: true, observe: "response" })
      .subscribe(
        (response) => {
          if (response.status == 201) {
            window.location.href = response.body as string;
          } else {
            console.log('Response from retry');
            console.log(response.body);
          }
        },
        error => {
          console.log('Error while sending retry: ', error.message);
        }
      );
    }

    Response includes the the id of retried process. When import fails.
    In case any error occurs during import, there are limited attempts(5) that will retry to reload the import every period of time(5 seconds).
    Once all attempts have been exhausted, the process status will be set to "Failed", and an error message will be set.
    This request is used to reset the attempts and error message, and start import again.
