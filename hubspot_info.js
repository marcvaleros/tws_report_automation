require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

const TWS_HUBSPOT_BASE_URL = "https://api.hubapi.com";

/** Get relevant information from contact -> company */
const getHubspotInfo = async (phoneNumber) => {
  try {
    let companyID;
    let company;
    let contact = await getContactInfo(phoneNumber); 

    if(contact !== 0){
      companyID = await getAssociatedCompany(contact.id);
      company = await getCompanyInfo(companyID);
      return {contact, company};
    }else{
      console.error("Contact Information is null");
      return null;
    }

  } catch (error) {
    console.error("Failed to fetch contact information");
    return null;
  }

}

/** Get Detailed Company Information  */
const getCompanyInfo = async (companyID) => {
  if(companyID){
    let endpoint = `/crm/v3/objects/companies/${companyID}`;
    
    try {
      const response = await axios.get(`${TWS_HUBSPOT_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      console.log(`Successfully Fetched Company Information`);
      console.log(response.data.properties.name);
      
      return response.data;
    } catch (error) {
      console.log(`Fetch Associated Company Failed: ${error}`);
      return null;
    }
  }
} 

/** Get Associated Company ID via Contact  
 * @returns Company Object 
*/
const getAssociatedCompany = async (contactID) => {

  if(contactID){
    let endpoint = `/crm/v3/objects/contacts/${contactID}/associations/companies`;
    try {
      const response = await axios.get(`${TWS_HUBSPOT_BASE_URL}${endpoint}`, {
        headers:{
          'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        }
      })
      
      console.log(`Successfully Fetched Associated Company ID`);
      return response.data.results[0].id;
    } catch (error) {
      console.log(`Fetch Associated Company Failed: ${error}`);
      return null;
    }
  }
  
  
}

/** Get Contact Information via Phone Number and return the Contact ID
 * 
 * @returns contact object containing the contact id
*/
const getContactInfo = async (phoneNumber) => {
  let endpoint = "/crm/v3/objects/contacts/search";
  const formattedPhone = formatPhoneNumber(phoneNumber);


  const requestBody = {
    "filters": [
      {
        "propertyName": "phone",
        "operator": "CONTAINS_TOKEN",
        "value": `*${formattedPhone}`
      }
    ],
    "sorts": [{
        "propertyName": "createdate",
        "direction": "DESCENDING"
      }],
    "properties": [
      "firstname",
      "lastname",
      "email",
      "createdate",
      "phone",
      "hs_object_id",
      "hs_lead_status",
      "project",
    ],
    "limit": 1,
  };

  try {
    const response = await axios.post(`${TWS_HUBSPOT_BASE_URL}${endpoint}`, requestBody, {
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if(response.data.results.length > 0){
      console.log("Successfully fetched contact info from phonenumber");
      return response.data.results[0];
    }else{
      console.log("Failed to get the hubspot contact via phonenumber");
      return null;
    }
  } catch (error) {
    console.error("Failed to get the hubspot contact via phonenumber",error);
    return null;
  }
}

/**Format phone number from E.164 to trimmed number */
const formatPhoneNumber = (phoneNumber) => {
  return phoneNumber.replace('+1', '');
}


module.exports = {
  getHubspotInfo
}