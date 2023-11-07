// Using the following get  the "access" property
const pdf_writer_functions = require('./pdf_writer_functions');
var request = require('request');
const fs = require('fs');
const path = require('path');
const utilities = require('./utilities');
const subscriptions = require('./subscriptions');
require('dotenv').config();

// Build customer delivery orders (picklists)
async function subscription(yesterday) {
  try {
    console.log("running subscription updater")

    url = 'https://localline.ca/api/backoffice/v2/orders/export/?' +
      'file_type=orders_list_view&' +
      'send_to_email=false&destination_email=fullfarmcsa%40deckfamilyfarm.com&direct=true&' +
      `start_date=${yesterday}&` +
      `end_date=${yesterday}&` +
      'payment__status=PAID&payment__status=AUTHORIZED&' +
      'vendors=3148&price_lists=2719&status=OPEN'

    data = {}

    // Login
    data = await utilities.getAccessToken();
    const accessToken = JSON.parse(data).access;


    // Call the function and wait for the response
    (async () => {
      try {
        console.log("fetching customers ...")
        const customerData = await subscriptions.populateCustomers(accessToken);
        //console.log('Customer data:', customerData);

        // TODO: validate customerData makes sense
        data = await utilities.getRequestID(url, accessToken);
        const id = JSON.parse(data).id;

        // Wait for report to finish
        const subscription_result_url = await utilities.pollStatus(id, accessToken);

        // Download File
        if (subscription_result_url !== "") {
          utilities.downloadData(subscription_result_url, 'subscriptions_' + yesterday + ".csv", accessToken)
            .then((subscription_file_path) => {
              console.log('Downloaded file path:', subscription_file_path);
              subscriptions.run(subscription_file_path, customerData,yesterday).then((subscriptions_pdf) => {
                try {
                  utilities.sendSubscribersEmail(subscriptions_pdf, 'subscriptions_' + yesterday+'.pdf', 'Subscriptions made on ... ' + yesterday)
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
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

const year = yesterday.getFullYear();
const month = String(yesterday.getMonth() + 1).padStart(2, '0'); // Months are 0-based
const day = String(yesterday.getDate()).padStart(2, '0');

const yesterdayFormatted = `${year}-${month}-${day}`;

subscription(yesterdayFormatted);
