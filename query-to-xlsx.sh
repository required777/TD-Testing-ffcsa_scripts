const fs = require('fs');
const mysql = require('mysql');
const XLSX = require('xlsx');
const config = require('config');

// Check if the file path is provided as an argument
if (process.argv.length < 3) {
  console.log('Please provide a file path as an argument.');
  process.exit(1);
}

// Read the file containing the query
const filePath = process.argv[2];
const query = fs.readFileSync(filePath, 'utf8');

// Retrieve MySQL connection parameters from config
const host = config.get("server.host");
const user = config.get("server.user");
const password = config.get("server.password");
const database = config.get("server.database");

// MySQL connection configuration
const connection = mysql.createConnection({
   host : host,
   user : user,
   password : password,
   database : database
})

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  }

  console.log('Connected to MySQL.');

  // Execute the query
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      process.exit(1);
    }

    console.log('Query executed successfully.');

    // Convert results to XLSX format
    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet 1');

    // Write XLSX file
    const outputFilePath = `${filePath}.xlsx`;
    XLSX.writeFile(workbook, outputFilePath);

    console.log(`Results written to ${outputFilePath}.`);

    // Close the MySQL connection
    connection.end((err) => {
      if (err) {
        console.error('Error closing MySQL connection:', err);
      }

      console.log('MySQL connection closed.');
    });
  });
});
