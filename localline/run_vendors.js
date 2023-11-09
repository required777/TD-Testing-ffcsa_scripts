// Using the following get  the "access" property
const pdf_writer_functions = require('./pdf_writer_functions');
var request = require('request');
const fs = require('fs');
const path = require('path');
const utilities = require('./utilities');
const vendors = require('./vendors');
require('dotenv').config();

// Build customer delivery orders (picklists)
async function vendor(lastMonth) {
  try {
    console.log("running vendor report updater")

    url = 'https://localline.ca/api/backoffice/v2/orders/export/?' +
    'file_type=orders_list_view&send_to_email=false&destination_email=fullfarmcsa%40deckfamilyfarm.com&direct=true&' +
    `fulfillment_date_start=${lastMonth.first}&` +
    `fulfillment_date_end=${lastMonth.last}&` +
    '&status=OPEN&status=NEEDS_APPROVAL&status=CANCELLED&status=CLOSED'

    console.log(url)
    data = {}

    // Login
    data = await utilities.getAccessToken();
    const accessToken = JSON.parse(data).access;

    // Call the function and wait for the response
    (async () => {
      try {
        console.log("fetching vendors ...")
        data = await utilities.getRequestID(url, accessToken);
        const id = JSON.parse(data).id;

        // Wait for report to finish
        const vendor_result_url = await utilities.pollStatus(id, accessToken);

        // Download File
        if (vendor_result_url !== "") {
          utilities.downloadData(vendor_result_url, 'vendors_' + lastMonth.last + ".csv", accessToken)
            .then((vendor_file_path) => {
              console.log('Downloaded file path:', vendor_file_path);
              vendors.run(vendor_file_path,lastMonth.last).then((vendors_pdf) => {
                try {
                  utilities.sendEmail(vendors_pdf, 'vendors_' + lastMonth.last+'.pdf', 'Vendor Report Summary Ran ' + lastMonth.last)
                } catch (error) {
                  console.error('Error:', error);
                  utilities.sendErrorEmail(error)
                }
              }).catch((error) => {
                console.error('Error:', error);
                utilities.sendErrorEmail(error)
              })
            })
            .catch((error) => {
              console.error('Error:', error);
              utilities.sendErrorEmail(error)
            });
        } else {
          console.error('file generation not completed in 1 minute')
          utilities.sendErrorEmail("file generation not completed in 1 minute")
        }
      } catch (error) {
        console.error('Error in the main function:', error);
        utilities.sendErrorEmail(error)
      }
    })();
  } catch (error) {
    console.error('An error occurred:', error);
    utilities.sendErrorEmail(error)
  }
}

// Run the delivery_order script
//yesterdayFormatted = '2023-10-31'

vendor(utilities.getLastMonth());
