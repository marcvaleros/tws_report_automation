require('dotenv').config();
const {parentPort, workerData} = require('worker_threads');
const RC_SDK = require('@ringcentral/sdk').SDK;
const { uploadFileToSlack } = require('./slack');
const { getHubspotInfo } = require('./hubspot_info');


//register to RC app usin g client id and secret
const rcsdk = new RC_SDK({
  'server': process.env.RC_SERVER_URL,
  'clientId': process.env.RC_CLIENT_ID,
  'clientSecret': process.env.RC_CLIENT_SECRET
});

const platform = rcsdk.platform();

// console.log('Worker Data:', workerData);

platform.login({ jwt: workerData.jwt })
  .then((res) => {
    parentPort.postMessage(`${workerData.name} logged in successfully.`);
    manageSubscriptions(platform);
    // deleteAllSubscriptions(platform);
    keepAlive();
  })
  .catch(err => {
    parentPort.postMessage(`Login failed for ${workerData.name}: ${err}`);
  });


platform.on(platform.events.loginError, function(e){
  console.log("Unable to authenticate to platform. Attempting to Authenticate.", e.message);
  process.exit(1)
});


const manageSubscriptions = async (platform) => {
  try {
    const response = await platform.get('/restapi/v1.0/subscription');
    const subscriptions = await response.json();
    console.log(`These are the subscriptions of ${workerData.name}: ${JSON.stringify(subscriptions,null,1)}`);
    
    let existingSubscription = subscriptions.records.find(subscription => subscription.deliveryMode.transportType === 'WebHook' && 
      subscription.deliveryMode.address === `${process.env.REQUEST_URL}/webhook`
    );
        
    if(existingSubscription !== undefined){
      parentPort.postMessage(`Existing Subscription Found for ${workerData.name} with subscription ID ${existingSubscription.id}`);
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
      parentPort.postMessage(`Subscription created for ${workerData.name} with subscription ID ${subscriptionData.id}`);
    }

  } catch (error) {
    console.error(`Failed creating a subscription: ${error}`);
  }
}

const deleteAllSubscriptions = async (platform) => {
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

// Keep the worker alive without doing anything continuously
const keepAlive = async () => {
  while (true) {
    await new Promise(resolve => setTimeout(resolve, 60000)); // Keep alive every 60 seconds
  }
};

const get_call_logs = async (body) => {
  try {
    const maxAttempts = 30;
    const delayMs = 5000; 

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Polling Attempt ${attempt}`);
      
      const queryParams = { sessionId: body.sessionId };
      const response = await platform.get(`/restapi/v1.0/account/~/extension/~/call-log`, queryParams);
      const recordArr = await response.json();

      // console.log(JSON.stringify(`This is the response json ${JSON.stringify(recordArr,null,1)}`));
      
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

parentPort.on('message', async (msg) => {
  if (msg.type === 'getCallLogs') {
    await get_call_logs(msg.body);
  }
});

module.exports = {
  get_call_logs
}
