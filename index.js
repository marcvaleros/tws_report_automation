require('dotenv').config();
const express = require('express');
const { uploadFileToSlack } = require('./slack');
const { getHubspotInfo } = require('./hubspot_info');
const cors = require('cors');

//create a server 
const app = express();
const port = process.env.PORT || 8080;
app.use(cors());

app.get('/', (req, res) => {
  res.send('Automation for TWS with Hubspot and RingCentral! Your server is running.');
});

// Middleware to parse JSON request body
app.use(express.json());

const RC_SDK = require('@ringcentral/sdk').SDK;

const accounts = JSON.parse(process.env.RC_ACCOUNTS);
const platforms = [];

const loginToAllAccounts = async () => {
  for(const account of accounts) {
    const rcsdk = new RC_SDK({
      server: account.server,
      clientId: account.clientId,
      clientSecret: account.clientSecret
    });

    const platform = rcsdk.platform();
    platforms.push({platform, accountID: account.clientId })

    try {
      await platform.login({jwt: account.jwt});
      console.log(`Logged into RingCentral account: ${account.clientId}`);
      await checkAndCreateSubscription(platform, account.clientId);
      //await deleteAllSubscriptions(platform, account.clientId);

      platform.on(platform.events.loginError, function(e){
        console.error(`Unable to authenticate to RingCentral for account: ${account.clientId}`, e.message);
      })
      
    } catch (error) {
      console.error(`Failed to log in to RingCentral account: ${account.clientId}`, error);
    }

  }
}

app.post('/webhook', async (req,res) => {
  const validation_token = req.headers['validation-token'];

  if (validation_token){                                                   // validation token is only added to headers during webhook setup process
    res.setHeader('Validation-Token', validation_token);
    res.status(200).send("Validation Token Attached to Headers");                
  } else {                                                                 // acquire the call logs of a specific number
    const reqBody = req.body;
    if(reqBody && reqBody.event.includes('telephony/sessions') && reqBody.body.parties[0].status.code === "Disconnected"){
        console.log(JSON.stringify(reqBody.body,null,2));
        await processCallLogs(reqBody.body);
    }

    res.status(200).send('OK');
  }
});


const checkAndCreateSubscription = async (platform, accountId) => {
  try {
    const response = await platform.get('/restapi/v1.0/subscription');
    const subscriptions = await response.json();
    console.log(JSON.stringify(subscriptions,null,2));
    
    let existingSubscription = subscriptions.records.find(subscription => subscription.deliveryMode.transportType === 'WebHook' && 
      subscription.deliveryMode.address === `${process.env.REQUEST_URL}/webhook`
    );
        
    if(existingSubscription){
      console.log(`Existing Subscription Found for account ${accountId}: `, existingSubscription.id);
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

      console.log( `New Subscription Created for account ${accountId}`, subscriptionData.id);
      console.log('Subscription Data', subscriptionData);
    }

  } catch (error) {
    console.error(`Failed creating a subscription for account ${accountId}:`,error);
  }
}

const deleteAllSubscriptions = async (platform, accountId) => {
  try {
    const response = await platform.get('/restapi/v1.0/subscription');
    const subscriptions = await response.json();

    for(let subscription of subscriptions.records){
      const subscriptionId = subscription.id;
      await platform.delete(`/restapi/v1.0/subscription/${subscriptionId}`);
      console.log(`Deleted Subscription for account ${accountId}with ID: ${subscriptionId}`);
    }
    console.log(`All Subscriptions have been deleted for account ${accountId}`);    
  } catch (error) {
    console.log(`Failed to delete subscriptions for account ${accountId}:`, error);
  }
}

const processCallLogs = async (body) =>{
  for (const {platform, accountId} of platforms){
    try {
      const maxAttempts = 20;
      const delayMs = 5000;
      console.log(`Processing call logs for account: ${accountId}`);
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`Polling Attempt ${attempt}`);
        const queryParams = {sessionId: body.sessionId};
        const response = await platform.get(`/restapi/v1.0/account/~/extension/~/call-log`,queryParams);
        const recordArr = await response.json();

        if(recordArr?.records?.length > 0){
          const record = recordArr.records[0];

          if(record.duration >= process.env.DURATION){
            let hubspotInfo;
              // Check whether it's inbound or outbound
              if (record.direction === "Inbound") {
              hubspotInfo = await getHubspotInfo(record.from?.phoneNumber);
            } else {
              hubspotInfo = await getHubspotInfo(record.to?.phoneNumber);
            }

            await uploadFileToSlack(record, platform, hubspotInfo);
            return;
          }
        }else {
          console.log('Recording metadata is not available or below duration.');
        }

        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`Error retrieving call logs from RingCentral account: ${accountId}`, error);
    }
  }
}

const get_call_logs = async (body) => {
    try {
      const maxAttempts = 30;
      const delayMs = 5000;
  
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`Polling Attempt ${attempt}`);
        
        const queryParams = { sessionId: body.sessionId };
        const response = await platform.get(`/restapi/v1.0/account/~/extension/~/call-log`, queryParams);
        const recordArr = await response.json();
  
        console.log(JSON.stringify(`This is the response json ${JSON.stringify(recordArr,null,1)}`));
        
        if (recordArr?.records?.length > 0) {
          const record = recordArr.records[0];
  
          if (record.duration >= process.env.DURATION) {
            console.log(`contentURI: ${record.recording.contentUri}`);
            let hubspotInfo;

            //check whether it's inbound or outbound
            if(record.direction === "Inbound"){
              console.log(`INBOUND: This is the hubspot info returned from this number ${record.from?.phoneNumber}`);
              hubspotInfo = await getHubspotInfo(record.from.phoneNumber);  // if inbound, use the from attribute 
            }else{
              console.log(`OUTBOUND: This is the hubspot info returned from this number ${record.to?.phoneNumber}`);
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


loginToAllAccounts();

app.listen(port, () =>{
  console.log(`Server is running on port ${port}`);
})


