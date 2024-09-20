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
    let project = await getAssociatedDeal(contact.id);

    console.log(`Contact is ${JSON.stringify(contact,null,1)}`);
    
    if(contact !== 0){
      companyID = await getAssociatedCompany(contact.id);
      company = await getCompanyInfo(companyID);
      return {contact, company, project};
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
  const formattedPhone = formatPhone(phoneNumber);

  const requestBody = {
    "filters": [
      {
        "propertyName": "phone",
        "operator": "CONTAINS_TOKEN",
        "value": `${formattedPhone}`
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
const formatPhone = (phoneNumber) => {
  const countryCodeRemove = phoneNumber.replace('+1', '');
  return countryCodeRemove.replace(/[-() ]/g, '');
}


// Figure out a way to get those contacts that was recently 
/** Function to get the associated deal of the contact that was returned. */
const getAssociatedDeal = async (contactID) => {
  let endpoint = `/crm/v3/objects/contacts/${contactID}/associations/deals`;
  if(contactID){
    try {
      const res = await axios.get(`${TWS_HUBSPOT_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization' : `Bearer ${process.env.HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      if(res.data.results.length > 0){
        if(res.data.results.length === 1){ 
          const dealID = res.data.results[0].id;          //just one deal - just return it right away
          console.log(`This is the deal ID : ${dealID}`);
          
          const assoc_deal = await axios.get(`${TWS_HUBSPOT_BASE_URL}/crm/v3/objects/deals/${dealID}?properties=dealname`,{
            headers: {
              'Authorization' : `Bearer ${process.env.HUBSPOT_API_KEY}`,
              'Content-Type': 'application/json',
            }
          });
          // console.log(JSON.stringify(assoc_deal.data,null,1));
          const dealName = assoc_deal.data.properties.dealname;
          return dealName; 
        }else{
          return null;                  //many associated deals, get the recent deal
        }
      }
      
    } catch (error) {
      console.log(`Fetch Associated Deal Failed: ${error}`);
      return null;
    }

  }else{
    console.log(`Contact ID is not defined: ${contactID}`);
  }

}


module.exports = {
  getHubspotInfo
}