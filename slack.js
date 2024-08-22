require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');


// const getUploadURL = async (url, companyName, dot, user_name, phone,companyId, duration) => {
const getUploadURL = async (record, platform) => {
  try {

    console.log(JSON.stringify(record,null,2));
    
    // Fetch the file from the URL
    const url = record.contentUri;

    const response = await platform.get(url);
    const fileBuffer = await response.buffer();
    const urlArray =  url.split('/');
    const fileName = urlArray[urlArray.length - 2] || `${record.id}.mp3`
    const size = fileBuffer.length;


    console.log(fileBuffer.length);
    console.log(fileName);

    // Get the Slack upload URL
    try{
      const slackRes = await axios.get(`https://slack.com/api/files.getUploadURLExternal?filename=${fileName}&length=${size}`, {
        headers: {
          'Authorization': `Bearer ${process.env.SLACK_TOKEN}`
        }
      });
      const slackData = slackRes.data;
      console.log(JSON.stringify(slackData,null,2));

        if (slackRes.status === 200) {
          // Prepare the form data for upload
          const form = new FormData();
          form.append('file', fileBuffer, {
            filename: fileName,
            contentType: 'audio/mpeg'
          });
    
          // Upload the file to Slack
          const uploadRes = await axios.post(slackData.upload_url, form, {
            headers: {
              'Authorization': `Bearer ${process.env.SLACK_TOKEN}`,
              ...form.getHeaders()
            }
          });
    
          if (uploadRes.status === 200) {
            console.log(uploadRes.data);
            // await completeUploadToSlack(slackData.file_id, companyName, dot, user_name, phone, companyId, duration);
            await completeUploadToSlack(slackData.file_id);
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


async function completeUploadToSlack(fileId) {
// async function completeUploadToSlack(fileId, companyName, dot, aircall_user_name, phone,companyId, duration) {
  const payload = {
    files: [
      {
        id: fileId,
        title: `test recording`,
        // title: `${aircall_user_name} - ${companyName} - ${dot}`,
      }
    ],
    channel_id: process.env.SLACK_CHANNEL_ID,
    initial_comment: 'Test Recording'
    // `Team Member: ${aircall_user_name}\nCompany: ${companyName}.\nPhone: ${phone}\nDOT: ${dot}\nHubspot Link: ${'https://app.hubspot.com/contacts/6919233/record/0-2/'+ (companyId || 'N/A')}\nCall Length: ${convertSecsToMins(duration)}\n`
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

module.exports = {
  getUploadURL
}