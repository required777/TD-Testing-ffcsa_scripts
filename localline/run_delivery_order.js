// TODO: Generate the fullfillment date to run these reports to generate the First Tuesday or the First Saturday after running
// also, check to make sure order is closed (run Thursday after 1am or Monday after 1am)

// Using the following get  the "access" property
const pdf_writer_functions = require('./pdf_writer_functions');
var request = require('request');
const fs = require('fs');
const path = require('path');
const utilities = require('./utilities');
require('dotenv').config();

// Build customer delivery orders (picklists)
async function delivery_order(fullfillmentDate) {
  try {
    console.log("running delivery_order builder")

    data = {}
    delivery_order_pdf = ''

    // Login
    data = await utilities.getAccessToken();
    const accessToken = JSON.parse(data).access;

    // Download Orders
    url = 'https://localline.ca/api/backoffice/v2/orders/export/?' +
      'file_type=orders_list_view&send_to_email=false&destination_email=fullfarmcsa%40deckfamilyfarm.com&direct=true&' +
      `fulfillment_date_start=${fullfillmentDate}&` +
      `fulfillment_date_end=${fullfillmentDate}&` +
      '&status=OPEN&status=NEEDS_APPROVAL&status=CANCELLED&status=CLOSED'
    data = await utilities.getRequestID(url, accessToken);
    const id = JSON.parse(data).id;

    // Wait for report to finish
    const orders_result_url = await utilities.pollStatus(id, accessToken);

    // Download File
    if (orders_result_url !== "") {
      utilities.downloadData(orders_result_url, 'orders_list_' + fullfillmentDate + ".csv")
        .then((orders_file_path) => {
          console.log('Downloaded file path:', orders_file_path);
          pdf_writer_functions.writeDeliveryOrderPDF(orders_file_path)
            .then((delivery_order_pdf) => {
              utilities.sendEmail(delivery_order_pdf, 'delivery_orders.pdf', 'FFCSA Reports: Delivery Orders for ' + fullfillmentDate)
            }).catch((error) => {
              console.error("Error in writeDeliveryOrderPDF:", error);
            });
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
fullfillmentDate = '2023-10-31'
delivery_order(fullfillmentDate);