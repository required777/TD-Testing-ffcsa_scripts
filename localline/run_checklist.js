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
async function checklist(fullfillmentDate) {
  try {
    console.log("running checklist builder")
    delivery_order_file_path = 'data/orders_list_' + fullfillmentDate + ".csv"

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

    dairy_file = 'data/dairy.xlsx'
    frozen_file = 'data/frozen.xlsx'
    // Download File
    utilities.downloadBinaryData(dairy_url, dairy_file, accessToken)
      .then((dairy_file) => {
        utilities.downloadBinaryData(frozen_url, frozen_file, accessToken)
          .then((frozen_file) => {
            pdf_writer_functions.writeChecklistPDF(dairy_file, frozen_file, delivery_order_file_path)
              .then((checklist_pdf) => {                
                utilities.sendEmail(checklist_pdf, 'checklists.pdf', 'FFCSA Reports: Checklists for ' + fullfillmentDate)
              }).catch((error) => {
                console.error("Error in writeChecklistPDF:", error);
              });
          })
          .catch((error) => {
            console.log('error fetching frozen products list, continuing to run checklist process using local copy as this file often halts....');
            pdf_writer_functions.writeChecklistPDF(dairy_file, frozen_file, delivery_order_file_path)
              .then((checklist_pdf) => {
                utilities.sendEmail(checklist_pdf, 'checklists.pdf', 'FFCSA Reports: Checklists for ' + fullfillmentDate)
              }).catch((error) => {
                console.error("Error in writeChecklistPDF:", error);
              });
          });
      })
      .catch((error) => {
        console.error('error fetching dairy products list');
      });

  } catch (error) {
    console.error('A general occurred:', error);
  }
}

// Run the checklist script
///fullfillmentDate = '2023-10-31'
fullfillmentDateObject = utilities.getNextFullfillmentDate()

checklist(fullfillmentDateObject.date);