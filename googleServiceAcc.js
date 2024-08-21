const { google } = require('googleapis');
const path = require('path') 

const keyFilePath = path.join(__dirname, 'credentials', 'credentials.json');

console.log(keyFilePath);


const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

async function writeToSheet() {
  const spreadsheetId = '1K9bYth0KT6ixWLiLsznLd0TIxvClsLTJR70yJTIrHEU'; // Replace with your spreadsheet ID
  const range = 'EOD Report!A3'; 
  const valueInputOption = 'RAW';
  const resource = {
    values: [
      ['7/1/2024', 'Monday','9AM PST','8','6','3','3',' ','0','0','Send emails relevant to the calls'], 
    ],
  };

  try {
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: valueInputOption,
      resource: resource,
    });

    console.log('Update successful:', response.data);
  } catch (error) {
    console.error('Error updating sheet:', error);
  }
}



// writeToSheet();