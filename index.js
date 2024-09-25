require('dotenv').config();
const path = require('path');
const express = require('express');
const { Worker }  = require('worker_threads');
const RC_SDK = require('@ringcentral/sdk').SDK;
const db = require('./database');
const cors = require('cors')

//create a server 
const app = express();
const port = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'client/build')))

// Middleware to parse JSON request body
app.use(cors());
app.use(express.json());

let accounts = [];
const workers = {};

const fetchAccounts = () => {
  return new Promise((resolve, reject) => {
    const query = "SELECT * FROM ringcentral_credentials";
    db.query(query, (err, results)=>{
      if(err){
        reject(err);
      }else{
        resolve(results);
      }
    })
  })
};


const startPlatformWorker = (account) => {
  const worker = new Worker('./platformWorker.js', {
    workerData: account
  });

  worker.on('message', (message) => {
      console.log(`Message from worker for ${account.name}:`, message);
  });

  worker.on('error', (err) => {
    console.error(`Error from worker for ${account.name}:`, err);
  });

  worker.on('exit', (code) => {
    console.log(`Worker for ${account.name} exited with code ${code}`);
  });

  workers[account.extensionID] = worker;
};

const deleteWorkerSubscriptions = (worker, extensionID) => {
  return new Promise((resolve, reject) => {
    worker.postMessage({type: 'deleteSubscriptions'});
       
    setTimeout(() => {
      resolve();
    }, 5000); 
  });
}

const updateWorkers = async () => {
  let newAccounts = await fetchAccounts();
  console.log(`Old Accounts: ${JSON.stringify(accounts,null,2)}`);
  console.log(`New Accounts: ${JSON.stringify(newAccounts,null,2)}`);
  
//handles if there are deleted users in the database (will delete workers)
  for(const extensionID of Object.keys(workers)){
    if(!newAccounts.find(account => account.extensionID === extensionID)){
      try {
        await deleteWorkerSubscriptions(workers[extensionID], extensionID);
        console.log(`Deleted Subscriptions for user with extension ID ${extensionID}.`);
        workers[extensionID].terminate();
        delete workers[extensionID];
      } catch (error) {
        console.error(error);
      }
    }
  }

  //start if a given extension ID is not already in the workers
  newAccounts.forEach(acc => {
    if(!workers[acc.extensionID]){          
      startPlatformWorker(acc);
    }
  })

  accounts = newAccounts;
}

//an endpoint for the ringcentral webhook triggered when a call is disconnected
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

//an endpoint that store user info in the database 
app.post('/api/store-credentials', async (req, res) => {
  const {name, jwt} = req.body;

  const rcsdk = new RC_SDK({
    'server': process.env.RC_SERVER_URL,
    'clientId': process.env.RC_CLIENT_ID,
    'clientSecret': process.env.RC_CLIENT_SECRET
  });

  const platform = rcsdk.platform();

  try {
    const result = await platform.login({ jwt: jwt });
    const user = await result.json();
    const ext_id = user.owner_id;


    //do another query search in the db, check if the ext_id already existed
    const searchQuery = `SELECT * FROM ringcentral_credentials WHERE jwt = ?`;
    db.query(searchQuery, [jwt], (err,results) => {
      if(err){
        return res.status(500).send('Database Query Error');
      }

      if(results.length > 0){
        return res.status(409).send('User already subscribed to RC webhook');
      }

      const query = `INSERT INTO ringcentral_credentials (jwt, name, extensionID) VALUES (?,?,?)`;

      db.query(query, [jwt, name, ext_id], async (err) => {
        if(err){
          return res.status(500).send('Error Storing Credentials'); 
        }else{
          await updateWorkers();
          res.status(200).send('Credentials Stored Successfully');
        }
      })
  
    })
    
  } catch (error) {
    console.error('Error during login or database operation:', error);
    res.status(500).send('Error Processing Request');
  }
});

//create an endpoint that fetch all users in the database 
app.get('/rc/users', async (req, res) => {
  try {
    const query = 'SELECT * FROM ringcentral_credentials';
    db.query(query, (err, results) => {
      if(err){
        return res.status(500).json({error: 'Database Query Error'});
      }
      res.status(200).json(results);
    })
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

//create an endpoint that delete specific users base on their id
app.delete('/rc/user/:id', async (req, res) => {
  const {id} = req.params;
  const query = 'DELETE FROM ringcentral_credentials WHERE id = ?';

  try {
    db.query(query, [id], async (err) => {
      if(err){
        console.log(`Error deleting user with id ${id}`);
        res.status(500).json({error: 'Database Delete Error'})
      }
      console.log(`Account ${id} Deleted Successfully. Updating Workers`);
      await updateWorkers();
      res.status(200).json({message: 'User Deleted Successfully'})
    })
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
})


// The "catchall" handler: for any request that doesn't match one above, send back the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, async () =>{
  console.log(`Server is running on port ${port}`);
  await updateWorkers();
});

