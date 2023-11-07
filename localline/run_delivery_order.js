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
async function delivery_order(fullfillmentDateStart,fullfillmentDateEnd) {
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
      `fulfillment_date_start=${fullfillmentDateStart}&` +
      `fulfillment_date_end=${fullfillmentDateEnd}&` +
      '&status=OPEN&status=NEEDS_APPROVAL&status=CANCELLED&status=CLOSED'
    data = await utilities.getRequestID(url, accessToken);
    const id = JSON.parse(data).id;

    // Wait for report to finish
    const orders_result_url = await utilities.pollStatus(id, accessToken);

    // Download File
    if (orders_result_url !== "") {
      utilities.downloadData(orders_result_url, 'orders_list_' + fullfillmentDateEnd + ".csv")
        .then((orders_file_path) => {
          console.log('Downloaded file path:', orders_file_path);
          pdf_writer_functions.writeDeliveryOrderPDF(orders_file_path)
            .then((delivery_order_pdf) => {
              utilities.sendEmail(delivery_order_pdf, 'delivery_orders.pdf', 'FFCSA Reports: Delivery Orders for ' + fullfillmentDateEnd)
            }).catch((error) => {
              console.error("Error in writeDeliveryOrderPDF:", error);
              utilities.sendErrorEmail(error)
            });
        })
        .catch((error) => {
          console.error('Error:', error);
          utilities.sendErrorEmail(error)
        });
    } else {
      console.error('file generation not completed in 1 minute')
      utilities.sendErrorEmail(error)
    }
  } catch (error) {
    console.error('An error occurred:', error);
    utilities.sendErrorEmail(error)
  }
}

// Run the delivery_order script
//fullfillmentDate = '2023-10-31'
fullfillmentDateObject = utilities.getNextFullfillmentDate()
delivery_order(utilities.getNextFullfillmentDate().start,utilities.getNextFullfillmentDate().end);
