require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

const uploadFileToSlack = async (callLogs, platform, hb) => {
  let retryCount = 0;
  const maxRetries = 5;

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  while (retryCount < maxRetries) {
    try {
      const record = callLogs.recording;
      console.log(JSON.stringify(record,null,2));
      
      const url = record.contentUri;
  
      const auth = await platform.auth();
      const localStorageString = auth._cache._externals.localStorage["rc-platform"];
      const parsedAuthData = JSON.parse(localStorageString);
      const accessToken = parsedAuthData.access_token;
      console.log(`This is the url: ${url}?access_token=${accessToken}`);
      
      
      const response = await axios.get(`${url}?access_token=${accessToken}`, {
        responseType: 'arraybuffer', // Ensures that the file is fetched as a buffer
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log(`Successfully Fetched Recording`);
      
      const fileBuffer = Buffer.from(response.data); 
      const urlArray =  url.split('/');
      const fileName = urlArray[urlArray.length - 2] || `${record.id}.mp3`;
      const size = fileBuffer.length;

      console.log(fileBuffer);
      
  
      try{
        const slackRes = await axios.get(`https://slack.com/api/files.getUploadURLExternal?filename=${fileName}&length=${size}`, {
          headers: {
            'Authorization': `Bearer ${process.env.SLACK_TOKEN}`
          }
        });
        const slackData = slackRes.data;
        console.log(JSON.stringify(slackData,null,2));
  
          if (slackRes.status === 200) {
            const form = new FormData();
            form.append('file', fileBuffer, {
              filename: fileName,
              contentType: 'audio/mpeg'
            });
      
            const uploadRes = await axios.post(slackData.upload_url, form, {
              headers: {
                'Authorization': `Bearer ${process.env.SLACK_TOKEN}`,
                ...form.getHeaders()
              }
            });
      
            if (uploadRes.status === 200) {
              console.log(uploadRes.data);
              await completeUploadToSlack(slackData.file_id, callLogs, hb);
              console.log('Success ');
      
            } else {
              console.log('Upload Failed');
            }
          } else {
            console.log('Failed to get upload URL');
          }
      }catch(e){
        console.log(e);
      }
  
      return true;
    
    } catch (error) {
      console.error('Error Message:', error.message);

      if (error.message.includes('Request failed with status code 404')) {
        retryCount++;
        console.log(`Retry attempt ${retryCount}/${maxRetries}`);
        await delay(3000);
      } else {
        return false; // For other errors, don't retry
      }
    }
  }

  console.log('Max retry attempts reached.');
  return false;
} 

const completeUploadToSlack = async (fileId, logs, hb) => {
  const {direction, to, from, duration} = logs;
  let member,phone,name,lead_status,assoc_company,contactID,project;

  member = direction === "Inbound" ? to.name : from.name;
  phone = direction === "Inbound" ? from.phoneNumber : to.phoneNumber;

  // Apply HubSpot details only if the member is Zach Lam
  if(member === 'Zach Lam'){
    const {contact, company} = hb || {};
    name = contact?.properties?.firstname;
    lead_status = contact?.properties?.hs_lead_status;
    assoc_company = company?.properties?.name;
    contactID = contact?.id;
    project = hb?.project;
  }

  const commentParts = [
    member && `Team Member: ${member}`,
    name && `Contact: ${name}`,
    assoc_company && `Company: ${assoc_company}`,
    lead_status && `Lead Status: ${lead_status}`,
    project && `Project: ${project}`,
    contactID && `Hubspot Link: https://app.hubspot.com/contacts/46487044/record/0-1/${contactID ?? 'N/A'}`,
    phone && `Phone: ${phone}`,
    duration && `Call Length: ${convertSecsToMins(duration)}`
  ].filter(Boolean).join(`\n`);

  const titleParts = [
    assoc_company && name && `${assoc_company}_${name}.mp3`,
    !(assoc_company || name) && phone && `Recording ${phone.replace('+1','')}.mp3`,
  ];

  const filteredParts = titleParts.filter(Boolean)

  const title = filteredParts.length > 0 && titleParts[0] ? titleParts[0] : filteredParts.join('');

  const payload = {
    files: [
      {
        id: fileId,
        title: title,
      }
    ],
    channel_id: process.env.SLACK_CHANNEL_ID,
    initial_comment: commentParts
  };

  try {
    const response = await axios.post('https://slack.com/api/files.completeUploadExternal', payload, {
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(JSON.stringify(response.data, null, 5));
  } catch (error) {
    console.error('Complete Upload Failed!');
    console.error(error.message);
  }
}

const convertSecsToMins = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} min ${remainingSeconds} sec`;
}



module.exports = {
  uploadFileToSlack
}