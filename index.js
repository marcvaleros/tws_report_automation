require('dotenv').config();
const express = require('express');


//create a server 
const app = express();

app.get('/', (req, res) => {
  res.send('Report Automation for TWS with Hubspot and RingCentral! Your server is running.');
});

// Middleware to parse JSON request body
app.use(express.json());

//listen for any webhooks 



const port = process.env.PORT || 8080;

app.listen(port, () =>{
  console.log(`Server is running on port ${port}`);
})


