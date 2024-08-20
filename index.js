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

/* Authenticate a user using a personal JWT token */
const authenticate = async () => {
  try { 
    await platform.login({'jwt': process.env.RC_JWT});

    platform.on(platform.events.loginSuccess, function(e){
        read_user_calllog();
    });

    platform.on(platform.events.loginError, function(e){
        console.log("Unable to authenticate to platform. Check credentials.", e.message)
        process.exit(1)
    });
        
    
    console.log("Successfully Authenticated with JWT");
  } catch (error) {
    console.log('Error during JWT authentication:', error);
  }
}

const read_user_calllog = async () => {
  try {
    let queryParams = {
      
    }
    const response = await platform.get("/restapi/v1.0/account/~/extension/~/call-log");
    return response;
    
  } catch (error) {
    
  }
}

// try {
//   var resp = await platform.post('/restapi/v1.0/account/~/extension/~/ring-out', {
//     'from': { 'phoneNumber': "<YOUR RINGCENTRAL PHONE NUMBER>" },
//     'to':   { 'phoneNumber': "<THE PHONE NUMBER YOU ARE CALLING" },
//     'playPrompt': false
//   })
//   var jsonObj = await resp.json()
//   console.log("Call placed. Call status: " + jsonObj.status.callStatus)
// } catch (e) {
//   console.log("Unable to place a ring-out call.", e.message)
// }


app.listen(port, () =>{
  console.log(`Server is running on port ${port}`);
})

authenticate();


