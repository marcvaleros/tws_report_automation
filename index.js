require('dotenv').config();
const express = require('express');
const { uploadFileToSlack } = require('./slack');
const { getHubspotInfo } = require('./hubspot_info');

//create a server 
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('Automation for TWS with Hubspot and RingCentral! Your server is running.');
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

const loginJWT = async () => {
  try {
    platform.login({'jwt': process.env.RC_JWT}).then(async function (res) {
      return await res.json();
    }).then((r) => console.log("Login Response", r));

    platform.on(platform.events.loginSuccess, function(e){
      // deleteAllSubscriptions();
      checkAndCreateSubscription();
    });

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

platform.on(platform.events.loginError, function(e){
  console.log("Unable to authenticate to platform. Attempting to Authenticate.", e.message);
  process.exit(1)
});


app.post('/webhook', (req,res) => {
  const validation_token = req.headers['validation-token'];

  if (validation_token) {                                                   // validation token is only added to headers during webhook setup process
    res.setHeader('Validation-Token', validation_token);
    res.status(200).send("Validation Token Attached to Headers");                
  } else {                                                                 // acquire the call logs of a specific number
    const reqBody = req.body;
    if(reqBody && reqBody.event.includes('telephony/sessions') && reqBody.body.parties[0].status.code === "Disconnected"){
        console.log(JSON.stringify(reqBody.body,null,2));
        get_call_logs(reqBody.body)
    }

    res.status(200).send('OK');
  }
});


const checkAndCreateSubscription = async () => {
  try {
    const response = await platform.get('/restapi/v1.0/subscription');
    const subscriptions = await response.json();
    console.log(JSON.stringify(subscriptions,null,2));
    
    let existingSubscription = subscriptions.records.find(subscription => subscription.deliveryMode.transportType === 'WebHook' && 
      subscription.deliveryMode.address === `${process.env.REQUEST_URL}/webhook`
    );
        
    if(existingSubscription !== undefined){
      console.log('Existing Subscription Found: ', existingSubscription.id);
    } else {
      const newSubscription = await platform.post('/restapi/v1.0/subscription', {
        eventFilters: [
          '/restapi/v1.0/account/~/extension/~/telephony/sessions?statusCode=Disconnected&withRecordings=true'
        ],
        deliveryMode: {
          transportType: 'WebHook',
          address: `${process.env.REQUEST_URL}/webhook`
        },
         expiresIn: 630720000
      });

      const subscriptionData = await newSubscription.json();

      console.log('New Subscription Created', subscriptionData.id);
      console.log('Subscription Data', subscriptionData);
    }

  } catch (error) {
    console.error(`Failed creating a subscription: ${error}`);
    
  }
}

const deleteAllSubscriptions = async () => {
  try {
    const response = await platform.get('/restapi/v1.0/subscription');
    const subscriptions = await response.json();

    for(let subscription of subscriptions.records){
      const subscriptionId = subscription.id;
      await platform.delete(`/restapi/v1.0/subscription/${subscriptionId}`);
      console.log(`Deleted Subscription with ID: ${subscriptionId}`);
    }
    console.log("All Subscriptions have been deleted.");    
  } catch (error) {
    console.log(`Failed to delete subscriptions: ${error}`);
    
  }
}


const get_call_logs = async (body) => {
    try {
      const maxAttempts = 20;
      const delayMs = 5000;
  
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`Polling Attempt ${attempt}`);
        
        const queryParams = { sessionId: body.sessionId };
        const response = await platform.get(`/restapi/v1.0/account/~/extension/~/call-log`, queryParams);
        const recordArr = await response.json();
  
        if (recordArr?.records?.length > 0) {
          const record = recordArr.records[0];
  
          if (record.duration >= process.env.DURATION) {
            console.log(`contentURI: ${record.recording.contentUri}`);
            let hubspotInfo;

            //check whether it's inbound or outbound
            if(record.direction === "Inbound"){
              console.log(`INBOUND: This is the hubspot info returned from this number ${record.from.phoneNumber}`);
              hubspotInfo = await getHubspotInfo(record.from.phoneNumber);  // if inbound, use the from attribute 
            }else{
              console.log(`OUTBOUND: This is the hubspot info returned from this number ${record.to.phoneNumber}`);
              hubspotInfo = await getHubspotInfo(record.to.phoneNumber);
            }

            await uploadFileToSlack(record, platform, hubspotInfo);
            return;
          } else {
            console.log('Recording metadata is not available.');
          }
        }
  
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
  
      console.log('Recording metadata is not available after maximum attempts or below required duration.');
    } catch (error) {
      console.error('Error retrieving call logs from RingCentral:', error);
    }
};


loginJWT();

app.listen(port, () =>{
  console.log(`Server is running on port ${port}`);
})


