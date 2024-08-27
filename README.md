An automation script developed using NodeJS Javascript for TWS. The APIs used in this project were Hubspot API and RingCentral API. 
Functionality involves sending recordings from ringcentral and upload the audio files to slack from the metadata returned from RC's API. 
Ringcentral SDK was used to streamline the entire process from authorization using JWT and OAuth, error handling and webhook subscription.
Polling technique was used to wait for audio recordings to be readily avaialable after a call ends and for other asynchronous proceses.     
