require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');


const uploadFileToSlack = async (callLogs, platform, hb) => {
  try {

    const record = callLogs.recording;
    console.log(JSON.stringify(record,null,2));   
    
    const url = record.contentUri;
    const response = await platform.get(url);
    const fileBuffer = await response.buffer();
    const urlArray =  url.split('/');
    const fileName = urlArray[urlArray.length - 2] || `${record.id}.mp3`;
    const size = fileBuffer.length;

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
    console.error('Error:', error);
    console.error('Error Msg:', error.message);
    return false;
  }
} 

const completeUploadToSlack = async (fileId, logs, hb) => {
  // if(hb === null){
  //   console.log("Unknown number. No Hubspot Account");
  //   return;
  // }
  let member;
  let phone;
  
  if(logs.direction === "Inbound"){
    member = logs.to.name;
    phone = logs.from.phoneNumber;
  }else{
    member = logs.from.name;
    phone = logs.to.phoneNumber;
  }

  const duration = logs.duration;

  const name = hb?.contact?.properties?.firstname;
  const lead_status = hb?.contact?.properties?.hs_lead_status;
  const assoc_company = hb?.company?.properties?.name;
  const contactID = hb?.contact?.id;
  const project = hb?.project;

  const payload = {
    files: [
      {
        id: fileId,
        title: `${assoc_company}_${name}.mp3`,
      }
    ],
    channel_id: process.env.SLACK_CHANNEL_ID,
    initial_comment:
    `Team Member: ${member}\nContact: ${name}\nCompany: ${assoc_company}.\nLead Status: ${lead_status}\nProject: ${project}\nHubspot Link: ${'https://app.hubspot.com/contacts/46487044/record/0-1/'+ (contactID || 'N/A')}\nPhone: ${phone}\nCall Length: ${convertSecsToMins(duration)}\n`
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