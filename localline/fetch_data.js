// Test Reading CSV file, formatting data and generating repoprts
// Then write PDF


// Using the following get  the "access" property
const pdf_writer_functions = require('./pdf_writer_functions');
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
function getRequestID(urlRequest, accessToken) {
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
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      url: `${file_path}`,
    };

    const downloadDirectory = 'data'; // Define the subdirectory
    let filePath = '';

    request(options, (error, response, body) => {
      if (error) {
        console.error('Error downloading the file:', error);
        reject(error);
      } else {
        // Create the 'data' directory if it doesn't exist
        if (!fs.existsSync(downloadDirectory)) {
          fs.mkdirSync(downloadDirectory);
        }

        // Extract the filename from the URL
        const urlParts = options.url.split('/');
        const filename = urlParts[urlParts.length - 1];

        // Determine the file path for the downloaded CSV file
        filePath = path.join(downloadDirectory, filename);

        // Save the CSV content to the specified file
        fs.writeFileSync(filePath, body);
        console.log(`File saved at ${filePath}`);
        resolve(filePath);
      }
    });
  });
}



async function main() {
  try {
    data = {}
    downloadedFile = ''

    // Login
    data = await getAccessToken();
    const accessToken = JSON.parse(data).access;

    // Download Orders
    //url = 'https://localline.ca/api/backoffice/v2/orders/export/?file_type=orders_summary&send_to_email=false&destination_email=fullfarmcsa%40deckfamilyfarm.com&direct=true&fulfillment_date_start=2023-10-24&fulfillment_date_end=2023-10-24&status=OPEN&status=NEEDS_APPROVAL&status=CANCELLED&status=CLOSED'
    url = 'https://localline.ca/api/backoffice/v2/orders/export/?file_type=orders_list_view&send_to_email=false&destination_email=fullfarmcsa%40deckfamilyfarm.com&direct=true&fulfillment_date_start=2023-10-28&fulfillment_date_end=2023-10-28&status=OPEN&status=NEEDS_APPROVAL&status=CANCELLED&status=CLOSED'
    data = await getRequestID(url, accessToken);
    const id = JSON.parse(data).id;

    // Wait for report to finish
    const file_path = await pollStatus(id, accessToken);

    // Download File
    if (file_path !== "") {
      downloadData(file_path)
        .then((filePath) => {
          console.log('Downloaded file path:', filePath); 
          //writeDeliveryOrderPDF('data/orders_list_view_full_farm_csa_26_Oct_2023.csv')
          pdfFile = pdf_writer_functions.writeDeliveryOrderPDF(downloadedFile)
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    } else {
      console.log('file generation not completed in 1 minute')
    }

    // Send Email with pdf attachment

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();







