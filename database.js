require('dotenv').config();
const mysql = require('mysql2');

// const db = mysql.createConnection(process.env.CLEARDB_DATABASE_URL);

// function handleDisconnect (){
//   db.connect((err) => {
//     if(err){
//       console.error('Error Connecting to MySQL:', err);
//       setTimeout(handleDisconnect,2000); 
//     }else{
//       console.log('Connected to MySQL Database');
//     }
//   });

//   db.on('error', function(err) {
//     console.log('Database Error', err);
//     if(err.code === 'PROTOCOL_CONNECTION_LOST'){
//       handleDisconnect();
//     }else{
//       throw err;
//     }
//   })
// }

// handleDisconnect();

const db = mysql.createPool({
  uri: process.env.CLEARDB_DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;