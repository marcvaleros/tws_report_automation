require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOSTNAME,
  user: process.env.DB_USER,
  password: '',
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

