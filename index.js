require('dotenv').config();
const express = require('express');
const { uploadFileToSlack } = require('./slack');
const { getHubspotInfo } = require('./hubspot_info');


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
  // get_call_logs();
  checkAndCreateSubscription();
});

platform.on(platform.events.loginError, function(e){
  console.log("Unable to authenticate to platform. Check credentials.", e.message)
  process.exit(1)
});

//create webhook subscription

app.post('/webhook', (req,res) => {
  const event = req.body;
  console.log(event);
  
  if(event && event.event && event.event.includes('telephony/sessions')){
    console.log("Call ended event received:", event);
  }
  
  res.status(200).send('OK');
});


const checkAndCreateSubscription = async () => {
  try {
    const response = await platform.get('/restapi/v1.0/subscription');
    const subscriptions = await response.json();
    console.log(subscriptions);
    
    let existingSubscription = subscriptions.records.find(subscription => subscription.deliveryMode.transportType === 'Webhook' && 
      subscription.deliveryMode.address === `${process.env.REQUEST_URL}/webhook`
    );
    
    if(existingSubscription !== undefined){
      console.log('Existing Subscription Found: ', existingSubscription.id);
    } else {
      const newSubscription = await platform.post('/restapi/v1.0/subscription', {
        eventFilters: [
          '/restapi/v1.0/account/~/extension/~/telephony/sessions'
        ],
        deliveryMode: {
          transportType: 'WebHook',
          address: `${process.env.REQUEST_URL}/webhook`
        },
         expiresIn: 604800 // 1 week
      });

      const subscriptionData = await newSubscription.json();
      console.log('New Subscription Created', subscriptionData.id);
      // where to store subscriptionID (?)
      
    }

    
  } catch (error) {
    console.error(`Failed creating a subscription: ${error}`);
    
  }
}

const get_call_logs = async () => {
  try {
    const queryParams = {
      recordingType: 'Automatic',
      direction: 'Outbound'
    };

    const response = await platform.get("/restapi/v1.0/account/~/extension/~/call-log/APwugfaesUjvao1A", queryParams); 
    const callLogs = await response.json();

    // console.log(JSON.stringify(callLogs,null,2));
    const hubspotInfo = await getHubspotInfo(callLogs.to.phoneNumber)
    console.log(hubspotInfo);
    
    uploadFileToSlack(callLogs, platform, hubspotInfo);  // gets the data from the url and upload them to slack 
    
  } catch (error) {
    console.log('Error retrieving company call logs:', error);
  }
}


app.listen(port, () =>{
  console.log(`Server is running on port ${port}`);
})


