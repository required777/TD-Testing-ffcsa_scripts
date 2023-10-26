// TODO: 1. put the json body login information into body
// TODO: 2. create methods for waiting for responses to goto next part...
// TODO 3. grab final result and parse to supply better values
// TODO 4. email the final result.....


// Using the following get  the "access" property
var request = require('request');
const fs = require('fs');
const path = require('path');
require('dotenv').config();



// This is our login
function getAccessToken() {
  return new Promise((resolve, reject) => {

    var options = {
      'method': 'POST',
      'url': 'https://localline.ca/api/backoffice/v2/token',
      'headers': {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "username": process.env.USERNAME,
        "password": process.env.PASSWORD
      })

    };

    request(options, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}

// obtain "id" value and save
function getRequestID(urlRequest,accessToken) {
  return new Promise((resolve, reject) => {
    
    // submit download request -- supply returned "access" 
    var options = {
      'method': 'GET',
      'url': `${urlRequest}`,
      'headers': {
        'Authorization': `Bearer ${accessToken}`
      }
    };

    request(options, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}

function checkRequestId(id, accessToken) {
  return new Promise((resolve, reject) => {

    var options = {
      'method': 'GET',
      'url': `https://localline.ca/api/backoffice/v2/export/${id}/`,
      'headers': {
        'Authorization': `Bearer ${accessToken}`
      }
    };
    request(options, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });

  });
}

async function pollStatus(id, accessToken) {
  let status = null;
  let pollingStartTime = Date.now();

  const pollInterval = 5000; // 5 seconds
  const maxPollingTime = 60000; // 1 minutes

  while (status !== "COMPLETE") {
    const data = await checkRequestId(id, accessToken);
    status = JSON.parse(data).status;
    console.log(status);

    if (status === "COMPLETE") {
      return JSON.parse(data).file_path
      //return status; // Return the status if it's "COMPLETE"
    }

    if (Date.now() - pollingStartTime >= maxPollingTime) {
      console.error("Status not COMPLETE after 1 minute. Stopping polling.");
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  return ""; // Return an empty string
}

async function downloadData(file_path) {
  const options = {
    method: 'GET',
    url: `${file_path}`,
  };

  const downloadDirectory = 'data'; // Define the subdirectory

  request(options, (error, response, body) => {
    if (error) {
      console.error('Error downloading the file:', error);
    } else {
      // Create the 'data' directory if it doesn't exist
      if (!fs.existsSync(downloadDirectory)) {
        fs.mkdirSync(downloadDirectory);
      }

      // Extract the filename from the URL
      const urlParts = options.url.split('/');
      const filename = urlParts[urlParts.length - 1];

      // Determine the file path for the downloaded CSV file
      const filePath = path.join(downloadDirectory, filename);

      // Save the CSV content to the specified file
      fs.writeFileSync(filePath, body);
      console.log(`File saved at ${filePath}`);
    }
  });
}

async function main() {
  try {
    data = {}

    // Login
    data = await getAccessToken();
    const accessToken = JSON.parse(data).access;

    // Download Orders
    url = 'https://localline.ca/api/backoffice/v2/orders/export/?file_type=orders_summary&send_to_email=false&destination_email=fullfarmcsa%40deckfamilyfarm.com&direct=true&fulfillment_date_start=2023-10-24&fulfillment_date_end=2023-10-24&status=OPEN&status=NEEDS_APPROVAL&status=CANCELLED&status=CLOSED'
    data = await getRequestID(url,accessToken);
    const id = JSON.parse(data).id;

    // Wait for report to finish
    const file_path = await pollStatus(id, accessToken);

    // Download File
    if (file_path !== "") {
      console.log(file_path)
      downloadData(file_path)
    } else {
      console.log('file generation not completed in 1 minute')
    }

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();








