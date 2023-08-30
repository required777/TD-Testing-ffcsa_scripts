const mysql = require('mysql');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('config');

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

// Directory to store images
const imageDir = 'images';

// Create the directory if it doesn't exist
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir);
}
// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');

  // Query the table to retrieve sku and image data
  const query = 'SELECT sku, concat("https://ffcsa.deckfamilyfarm.com/static/media/",image) as image FROM shop_product where image is not null';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error querying the table:', err);
      connection.end();
      return;
    }

    // Download and save images
    results.forEach((row) => {
      const sku = row.sku;
      const imageUrl = row.image;
      const imageExtension = path.extname(imageUrl);
      const imageName = `${sku}${imageExtension}`;
      const imagePath = path.join(imageDir, imageName);

      // Check if the image already exists in the directory
      if (fs.existsSync(imagePath)) {
        console.log(`Image ${imageName} already exists in the directory`);
      } else {
        axios({
          method: 'get',
          url: imageUrl,
          responseType: 'stream',
		  timeout: 100000,
        })
          .then((response) => {
            response.data.pipe(fs.createWriteStream(imagePath));
            console.log(`Image ${imageName} downloaded and saved`);
          })
          .catch((error) => {
            console.error(`Error downloading image ${imageName}:`, error);
          });
      }
    });

    // Close the database connection
    connection.end();
  });
});
