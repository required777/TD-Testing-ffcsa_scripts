const XLSX = require('xlsx');
const _ = require('lodash');
var request = require('request');
const axios = require('axios');
require('dotenv').config();
const utilities = require('./utilities');

// Herdshare pricelist
run_analyzer('herdshare', 'https://localline.ca/api/backoffice/v2/price-lists/2966/products/export/?direct=true')
run_analyzer('members', 'https://localline.ca/api/backoffice/v2/price-lists/2718/products/export/?direct=true')
run_analyzer('guest', 'https://localline.ca/api/backoffice/v2/price-lists/3124/products/export/?direct=true')
run_analyzer('membership_purchases', 'https://localline.ca/api/backoffice/v2/price-lists/2719/products/export/?direct=true')


async function run_analyzer(pricelist_name, url) {

  data = await utilities.getAccessToken();
  const accessToken = JSON.parse(data).access;

  const input_file = 'data/' + pricelist_name + '_pricelist.xlsx'
  const output_file = 'data/' + pricelist_name + '_pricelist_analytics.csv'

  utilities.downloadBinaryData(url, input_file, accessToken)
    .then((input_file) => {
      // Load the Excel workbook
      const workbook = XLSX.readFile(input_file);

      // Specify sheet names
      const availabilitySheetName = 'Availability';
      const packagesSheetName = 'Packages and pricing';

      // Get sheet data
      const availabilitySheet = workbook.Sheets[availabilitySheetName];
      const packagesSheet = workbook.Sheets[packagesSheetName];

      // Convert sheets to arrays
      const availabilityData = XLSX.utils.sheet_to_json(availabilitySheet, { header: 1 });
      const packagesData = XLSX.utils.sheet_to_json(packagesSheet, { header: 1 });

      // Find the index of 'Local Line Product ID' in both sheets
      const availabilityIndex = availabilityData[0].indexOf('Local Line Product ID');
      const packagesIndex = packagesData[0].indexOf('Local Line Product ID');

      if (availabilityIndex !== -1 && packagesIndex !== -1) {
        // Merge the two datasets on 'Local Line Product ID'
        // Merge the two datasets on 'Local Line Product ID'
        // Merge the two datasets on 'Local Line Product ID'
        // Merge the two datasets on 'Local Line Product ID'
        const joinedData = _.mergeWith(
          _.keyBy(availabilityData, row => row[availabilityIndex]),
          _.keyBy(packagesData, row => row[packagesIndex]),
          (objValue, srcValue) => (_.isArray(objValue) ? objValue.concat(srcValue) : undefined)
        );

        // Extract and filter the desired columns
        const result = Object.values(joinedData)
          .filter(row => row[12] === 'Y') // Filter based on 'Visible' column
          .map(row => ({
            Vendor: row[5], // Vendor
            Product: row[4], // Product
            Visible: row[12], // Visible
            'Item Unit': row[21], // Item Unit
            'Charge Unit': row[23], // Charge Unit
            'Package Name': row[25], // Package Name
            '# of Items': row[27], // # of Items
            'Purchase Price': row[29], // Package Price
            'Retail Price': row[28], // Price List Adjusted Price
            'Margin': (((row[28] - row[29]) / row[28]) * 100).toFixed(0) // Margin calculation

          }));


        result.sort((a, b) => parseFloat(a.Margin) - parseFloat(b.Margin));

        // Create a new workbook
        const newWorkbook = XLSX.utils.book_new();
        const newSheet = XLSX.utils.json_to_sheet(result);

        // Add the new sheet to the new workbook
        XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Sheet1');

        // Write the new workbook to a file
        XLSX.writeFile(newWorkbook, output_file);
        console.log('output stored in ' + output_file)
      } else {
        console.error('The column "Local Line Product ID" was not found in both sheets.');

      }
    })
    .catch((error) => {
      console.log('error fetching file from server' + error);
    })
}