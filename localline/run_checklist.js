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
async function checklist(delivery_order_file_path) {
  try {
    dairy_data = {}
    frozen_data = {}
    dairy_file_path = ''
    frozen_file_path = ''

    // Login
    data = await utilities.getAccessToken();
    const accessToken = JSON.parse(data).access;

    //dairy tags
    dairy_url = 'https://localline.ca/api/backoffice/v2/products/export/?internal_tags=2244&direct=true'
    // frozen and turkey
    frozen_url = 'https://localline.ca/api/backoffice/v2/products/export/?internal_tags=2245,2266&direct=true'

    // Download File
    utilities.downloadBinaryData(dairy_url, 'data/dairy.xlsx', accessToken)
      .then((dairy_file_path) => {
        console.log('dairy file:', dairy_file_path);
        utilities.downloadBinaryData(frozen_url, 'data/frozen.xlsx', accessToken)
          .then((frozen_file_path) => {
            console.log('frozen file:', frozen_file_path);
            console.log(delivery_order_file_path)

            pdfFile = pdf_writer_functions.writeChecklistPDF(dairy_file_path, frozen_file_path, delivery_order_file_path)

            // Send Email with pdf attachment
          })
          .catch((error) => {
            console.error('Error:', error);
          });
      })
      .catch((error) => {
        console.error('Error:', error);
      });




  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Run the checklist script
delivery_order_file = 'data/orders_list_view_full_farm_csa_28_Oct_2023.csv_zhshi.csv'
checklist(delivery_order_file);