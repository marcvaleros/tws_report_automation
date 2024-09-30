require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection(process.env.CLEARDB_DATABASE_URL);
  // db = mysql.createConnection({
  //   host: process.env.DB_HOSTNAME,
  //   user: process.env.DB_USER,
  //   password: process.env.DB_PASSWORD || '',
  //   database: process.env.DB_NAME,
  // });

function handleDisconnect (){
  db.connect((err) => {
    if(err){
      console.error('Error Connecting to MySQL:', err);
      setTimeout(handleDisconnect,2000); 
    }else{
      console.log('Connected to MySQL Database');
    }
  });

  db.on('error', function(err) {
    console.log('Database Error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST'){
      handleDisconnect();
    }else{
      throw err;
    }
  })
}

handleDisconnect();


module.exports = db;