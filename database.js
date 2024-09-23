require('dotenv').config();
const mysql = require('mysql2');
console.log(process.env.DB_HOSTNAME, process.env.DB_USER, process.env.DB_NAME, process.env.DB_PASSWORD);


const db = mysql.createConnection({
  host: process.env.DB_HOSTNAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME
})

db.connect((err) => {
  if(err){
    console.error('Error Connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');

})

module.exports = db;