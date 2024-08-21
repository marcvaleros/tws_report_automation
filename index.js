require('dotenv').config();
const express = require('express');


//create a server 
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('Report Automation for TWS with Hubspot and RingCentral! Your server is running.');
});

// Middleware to parse JSON request body
app.use(express.json());


const RC_SDK = require('@ringcentral/sdk').SDK;
var rcsdk = new RC_SDK({
  'server': process.env.RC_SERVER_URL,
  'clientId': process.env.RC_CLIENT_ID,
  'clientSecret': process.env.RC_CLIENT_SECRET
});

var platform = rcsdk.platform();
platform.login({'jwt': process.env.RC_JWT});

platform.on(platform.events.loginSuccess, function(e){
  get_call_logs();
});

platform.on(platform.events.loginError, function(e){
  console.log("Unable to authenticate to platform. Check credentials.", e.message)
  process.exit(1)
});


const get_call_logs = async () => {
  try {
    // Fetch calls with automatic recordings
    const queryParams = {
      recordingType: 'Automatic',
      direction: 'Outbound'
    };

    const response = await platform.get("/restapi/v1.0/account/~/extension/~/call-log", queryParams);
    const callLogs = await response.json();

    console.log(JSON.stringify(callLogs,null,2));
    
    const recordings = callLogs.records.filter(call => call.recording && call.recording.contentUri);
    
    // Output the recordings
    recordings.forEach(recording => {
      console.log(`Call ID: ${recording.id}`);
      console.log(`Recording URL: ${recording.recording.contentUri}`);
      console.log('---');
    });
       
  } catch (error) {
    console.log('Error retrieving company call logs:', error);
  }
}


app.listen(port, () =>{
  console.log(`Server is running on port ${port}`);
})


