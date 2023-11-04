// TODO: Generate the fullfillment date to run these reports to generate the First Tuesday or the First Saturday after running
// also, check to make sure order is closed (run Thursday after 1am or Monday after 1am)

// Using the following get  the "access" property
const pdf_writer_functions = require('./pdf_writer_functions');
var request = require('request');
const fs = require('fs');
const path = require('path');
const utilities = require('./utilities');
require('dotenv').config();

// Build all check-lists
async function vendors(fullfillmentDate) {
  try {
    console.log("running checklist builder")
    delivery_order_file_path = 'data/orders_list_' + fullfillmentDate + ".csv"

    vendor_file_path = ''

    data = await utilities.getAccessToken();
    const accessToken = JSON.parse(data).access;

    products_url = 'https://localline.ca/api/backoffice/v2/products/export/?direct=true'
    products_file = 'data/products.xlsx'


    // Download File
    utilities.downloadBinaryData(products_url, products_file, accessToken)
      .then((products_file) => {
        pdf_writer_functions.writeVendorsPDF(products_file, delivery_order_file_path)
          .then((vendors_pdf) => {
            utilities.sendEmail(vendors_pdf, 'vendors.pdf', 'FFCSA Reports: Vendors Data for ' + fullfillmentDate)
          }).catch((error) => {
            console.error("Error in writeChecklistPDF:", error);
          });
      })
      .catch((error) => {
        console.log('error fetching vendorsfile, continuing to run checklist process using local copy as this file often halts....');
        pdf_writer_functions.writeVendorsPDF(products_file, delivery_order_file_path)
          .then((vendors_pdf) => {
            utilities.sendEmail(vendors_pdf, 'vendors.pdf', 'FFCSA Reports: Vendorts Data for ' + fullfillmentDate)
          }).catch((error) => {
            console.error("Error in writeChecklistPDF:", error);
          });
      })


  } catch (error) {
    console.error('A general occurred:', error);
  }
}

// Run the checklist script
//fullfillmentDate = '2023-10-31'
fullfillmentDateObject = utilities.getNextFullfillmentDate()
vendors(fullfillmentDateObject.date);
