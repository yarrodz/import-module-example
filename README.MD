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

##### Imports
Inside the 'imports' component, there are four other components for importing data from Airtable, Notion, Trello, and Postgres. They all have hardcoded requests with already provided parameters. Currently, these requests have authorization with my main account, so I cannot share credentials at the moment. I will create accounts for testing tomorrow.

##### create
    create() {
    const data = {
      "unit": "64835bd65cafe862fc0d323a", --- mongodb ObjectId
      "source": "API", import source. 'SQL' or 'API' 
      "api": { --- API sub-schema
        "method": "GET", --- request method. POST or GET
        "url": "https://api.airtable.com/v0/apprK7nZPyUs8NYPp/tblnUkpnYHhfresQn", --- request url 
        "responseType": "JSON", --- response type
        "datasetsPath": "data.records", --- datasets are typically not placed in the response directly. Instead, they are typically nested within the response object.
        "transferType": "Cursor Pagination", --- type of transfer. 'Offset pagination', 'Cursor pagination' or 'Chunk'
        "paginationOptions": { --- Pagination parameters
          "placement": "Query Parameters", --- placement inside request. 'Body' or 'Query parameters'.
          "cursorParameterPath": "data.offset", --- when we use cursor pagination transfer, the cursor string is placed inside the previous request response. We utilize the cursor to include it in the next request and retrieve the next set of data.
          "cursorParameter": "offset", --- cursor parameter name that will be used to include it in request 
          "limitParameter": "maxRecords", --- limit parameter name
          "limitValue": 384 --- the limitValue does not mean that we receive 384 per request. Airtable allows us to receive 100 datasets per request. Airtable uses this value to determine how many datasets we want to receive in total. If we specify the number greater than 100 it will include cursor in response. Mostly other api will use limitValue in default meaning it word.
        },
        "auth": { --- athorization for request  
          "type": "OAuth 2.0", --- type of authorization
          "oauth2": { --- params for oauth2
            "client_id": "901cdb99-7ab8-4b98-9b53-71ed73d05606",
            "scope": "data.records:read",
            "auth_uri": "https://airtable.com/oauth2/v1/authorize",
            "token_uri": "https://www.airtable.com/oauth2/v1/token",
            "use_code_verifier": true
          },
        }
      },
      "idColumn": "id", --- id column name of datasets
      "limitRequestsPerSecond": 1, --- tThe limit for requests per second that the API allows is 5. However, it never happened on my computer. Transforming and saving 100 datasets in parralel to mongo takes anywhere from half a second to a second
      "datasetsCount": 384 --- Count of total datasets
    };

    this.http.post('http://localhost:3000/imports/', data, { withCredentials: true, observe: "response" })
      .subscribe(
        (response) => {
          if (response.status == 201) { --- If we receive a 201 status, the client knows that it needs to redirect to the link provided in the response. (300 response codes are blocked for some reason.) The OAuth2 Auth Uri is included in the response. We will be navigated to the Airtable OAuth2 Uri, where we will grant access to use its data. Then, it will be redirected to the OAuth2 callback endpoint defined on the our server. Inside the callback function, will be send an additional request to receive the access and refresh tokens and then save them to mongo. Finally, we will be redirect the client back to the previous page with the provided query parameters. The client, using ActivatedRoute, will understand that it needs to make the same request, but it is already authorized.
            window.location.href = response.body as string;
          } else { --- we used simple authorization and received response right away
            console.log('Response from create');
            console.log(response.body);
          }
        },
        (error) => console.log('Error while sending create: ', error.message)
      );
  }


#####    
