require('dotenv').config();
const express = require('express');
const { Worker }  = require('worker_threads');
const db = require('./database');
const cors = require('cors')

//create a server 
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('Automation for TWS with Hubspot and RingCentral! Your server is running.');
});

// Middleware to parse JSON request body
app.use(cors());
app.use(express.json());

//list of accounts & make sure the number get's formatted before sending/getting to database
const accounts = [
  { 
    name:'Nathan',
    jwt:"eyJraWQiOiI4NzYyZjU5OGQwNTk0NGRiODZiZjVjYTk3ODA0NzYwOCIsInR5cCI6IkpXVCIsImFsZyI6IlJTMjU2In0.eyJhdWQiOiJodHRwczovL3BsYXRmb3JtLnJpbmdjZW50cmFsLmNvbS9yZXN0YXBpL29hdXRoL3Rva2VuIiwic3ViIjoiODEyMjc5MDE4IiwiaXNzIjoiaHR0cHM6Ly9wbGF0Zm9ybS5yaW5nY2VudHJhbC5jb20iLCJleHAiOjM4NzQwNjY3MzksImlhdCI6MTcyNjU4MzA5MiwianRpIjoibHQ3aHRKQnNRTU8tVHl3X0U0R2JwUSJ9.fgVvULSnF2kuYtjVX54934XPql0PugUQ9ujcwjk9MyYqq_txlJ4I7lJmh8Wnek-6DlA5oB2-lky29CDO_uirXwgqn1MwwJrYf7AgKEWI1D0ezKiFsuKAN8l0LUev1qckP56hN4milisOKRNzAB2z7B0akVGxXC5ABN_dq5mD6o18X5ifOMnk470O6cSWXnrOp-dMhrIdMIbG6AYsJgF4pqdpYuvReONdD6ZsnNUTQCxbIADdRdKH7UgtWob_XhbSI4YGhFVT9iDpfPtEsnEC3bLVO0Hb4KgclUd2pmhHNmzI19RC5MYAVAfkngaJws2tOYjZhZljSVjPH0g38UuI8g"},
  {
    name:'Zach',
    jwt: 'eyJraWQiOiI4NzYyZjU5OGQwNTk0NGRiODZiZjVjYTk3ODA0NzYwOCIsInR5cCI6IkpXVCIsImFsZyI6IlJTMjU2In0.eyJhdWQiOiJodHRwczovL3BsYXRmb3JtLnJpbmdjZW50cmFsLmNvbS9yZXN0YXBpL29hdXRoL3Rva2VuIiwic3ViIjoiMjA0Mjc1MzAxOSIsImlzcyI6Imh0dHBzOi8vcGxhdGZvcm0ucmluZ2NlbnRyYWwuY29tIiwiZXhwIjozODcyMzk2OTM3LCJpYXQiOjE3MjQ5MTMyOTAsImp0aSI6IkJfRFF0ekVoUTctdVRTYlhjdVpJR3cifQ.Aj1cxwpYjz2tS5wMWjhXyly-V3KNUDKJatjphHPyH1D8UsbIdrH0RF2b6ysHtAeeRm0uwbqr1cVGYZIWFh0dT2aq_eRSIXfKcV_VZKCapWLKRFnu9GGu1l2hmPqR29qiAyUQNLDJt5bGtmSu1rXm6ElXFELTUGA7dS70DUCXIMZhyqYhoDYVkq1_chI9QYlKkzr9VCmhfJdVymjtrYwYJHgmfwB5T9Ijifp86pBCNCJDSAz-gRE-A8E2ATmT4Ddb_HP8nZ61-BxYYzvY6PkQk_AfOistbTSCDmDgLmYEtUGECB8V2SAfUbd-nU-CqE8xLLU4oHjyGssHovwTLXA9hQ'
  }
];

const workers = {};

const startPlatformWorker = (account) => {
  const worker = new Worker('./platformWorker.js', {
    workerData: account
  });

  worker.on('message', (message) => {
    if(message.type === 'extensionID'){
      workers[message.extensionID] = worker;
      console.log(`Assigned worker to ${account.name} with Extension ID ${message.extensionID}`);
    }else{
      console.log(`Message from worker for ${account.name}:`, message);
    }
  });

  worker.on('error', (err) => {
    console.error(`Error from worker for ${account.name}:`, err);
  });

  worker.on('exit', (code) => {
    console.log(`Worker for ${account.name} exited with code ${code}`);
    if (code !== 0) {
      console.log(`Restarting worker for ${account.name}...`);
      startPlatformWorker(account);
    }
  });
};

accounts.forEach(account => startPlatformWorker(account));


app.post('/webhook', (req,res) => {
  const validation_token = req.headers['validation-token'];

  if (validation_token) {                                              // validation token is only added to headers during webhook setup process
    res.setHeader('Validation-Token', validation_token);
    res.status(200).send("Validation Token Attached to Headers");                
  } else {                                                                 // acquire the call logs of a specific number
    const reqBody = req.body;
    if(reqBody && reqBody.event.includes('telephony/sessions') && reqBody.body.parties[0].status.code === "Disconnected"){
        console.log(JSON.stringify(reqBody.body,null,2));
        let extensionID = reqBody.body.parties[0].extensionId;
        if(workers[extensionID]){                                     //trigger a function in the platformWorker and pass down the reqBody
          workers[extensionID].postMessage({type: 'getCallLogs', body: reqBody.body});
        }else{
          console.log(`No worker found for account with extension ID: ${extensionID}`);
        }
    }
    res.status(200).send('OK');
  }
});

app.post('/api/store-credentials', async (req, res) => {
  const {name, jwt} = req.body;
  console.log(req.body);
  
  const query = `INSERT INTO ringcentral_credentials (jwt, name) VALUES (?,?)`;

  db.query(query, [jwt, name], (err) => {
    if(err){
      return res.status(500).send('Error Storing Credentials');
    }else{
      
      res.status(200).send('Credentials Stored Successfully');
    }
  })
});



app.listen(port, () =>{
  console.log(`Server is running on port ${port}`);
});

