// TODO: Generate the fullfillment date to run these reports to generate the First Tuesday or the First Saturday after running
// also, check to make sure order is closed (run Thursday after 1am or Monday after 1am)

// Using the following get  the "access" property
const pdf_writer_functions = require('./pdf_writer_functions');
var request = require('request');
const fs = require('fs');
const path = require('path');
const utilities = require('./utilities');
const subscriptions = require('./subscriptions');
require('dotenv').config();

// Build customer delivery orders (picklists)
async function subscription(fullfillmentDate) {
  try {
    console.log("running subscription updater")

    data = {}

    // Login
    data = await utilities.getAccessToken();
    const accessToken = JSON.parse(data).access;

    // Download Orders
   /* url = 'https://localline.ca/api/backoffice/v2/orders/export/?' +
      'file_type=orders_list_view&send_to_email=false&destination_email=fullfarmcsa%40deckfamilyfarm.com&direct=true&' +
      `fulfillment_date_start=${fullfillmentDateStart}&` +
      `fulfillment_date_end=${fullfillmentDateEnd}&` +
      '&status=OPEN&status=NEEDS_APPROVAL&status=CANCELLED&status=CLOSED'
*/
    url = 'https://localline.ca/api/backoffice/v2/orders/export/?' + 
    'file_type=orders_list_view&send_to_email=false&destination_email=fullfarmcsa%40deckfamilyfarm.com&direct=true&' +    
    `fulfillment_date_start=${fullfillmentDate}&` +
    `fulfillment_date_end=${fullfillmentDate}&` +
    'payment__status=PAID&payment__status=AUTHORIZED&vendors=3148&price_lists=2719&status=OPEN'
    data = await utilities.getRequestID(url, accessToken);
    const id = JSON.parse(data).id;

    // Wait for report to finish
    const subscription_result_url = await utilities.pollStatus(id, accessToken);

    // Download File
    if (subscription_result_url !== "") {
      utilities.downloadData(subscription_result_url, 'subscriptions_' + fullfillmentDate + ".csv", accessToken)
        .then((subscription_file_path) => {
          console.log('Downloaded file path:', subscription_file_path);
          subscriptions.run(subscription_file_path).then((subscriptions_pdf) => {
            utilities.sendSubscribersEmail(subscriptions_pdf, 'subscriptions.pdf', 'Subscriptions made on ... ' + fullfillmentDate)
          })                   
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    } else {
      console.log('file generation not completed in 1 minute')
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Run the delivery_order script
//fullfillmentDate = '2023-10-31'
fullfillmentDateObject = utilities.getNextFullfillmentDate()
fullfillmentDate = fullfillmentDateObject.date;

subscription(fullfillmentDate);
