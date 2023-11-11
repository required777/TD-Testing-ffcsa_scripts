// Using the following get  the "access" property
var request = require('request');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const PDFDocument = require('pdfkit-table');
const fastcsv = require('fast-csv');
const ExcelJS = require('exceljs');
const utilities = require('./utilities');

async function writeDeliveryOrderPDF(filename) {
  return new Promise((resolve, reject) => {
    const pdf_file = 'data/delivery_order.pdf'

    // Create a new PDF document
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(pdf_file));

    // Initialize variables to group items by "Fulfillment Name"
    const customers = {}; // Store customer data including attributes
    let currentCustomerName = null;

    const sortedData = [];

    // Read the CSV file and sort by "Customer Name" before processing
    fs.createReadStream(filename)
      .pipe(fastcsv.parse({ headers: true }))
      .on('data', (row) => {
        sortedData.push(row);
      })
      .on('end', () => {
        // Sort the data by "Customer Name"
        sortedData.sort((a, b) => a['Customer'].localeCompare(b['Customer']));

        // Process the sorted data
        sortedData.forEach((row) => {
          const customerName = row['Customer'];
          const product = row['Product'] + ' - ' + row['Package Name'];
          const quantity = Math.round(parseFloat(row['Quantity']));
          const itemUnit = row['Item Unit']
          const vendor = row['Vendor']
          const category = row['Category']
          const customerPhone = row['Phone']
          const fullfillmentName = row['Fulfillment Name']
          const fullfillmentAddress = row['Fulfillment Address']
          const fullfillmentDate = utilities.formatDate(row['Fulfillment Date'])
          const customerNote = row['Customer Note']
          const startTime = row['Fulfillment - Pickup Start Time']
          const endTime = row['Fulfillment - Pickup End Time']
          const timeRange = startTime + ' to ' + endTime

          // If the customerName changes, start a new section
          if (customerName !== currentCustomerName) {
            currentCustomerName = customerName;
            customers[customerName] = {
              products: [],
              phone: customerPhone,
              fullfillmentName: fullfillmentName,
              fullfillmentAddress: fullfillmentAddress,
              fullfillmentDate: fullfillmentDate,
              timeRange: timeRange,
              customerNote: customerNote,
            };
          }

          if (category !== 'Membership') {
            customers[customerName].products.push({ product, quantity, itemUnit, vendor });
          }

        });

        // Iterate through items and generate the PDF content
        for (const customerName in customers) {
          const customerData = customers[customerName];

          if (customerData.products.length > 0) {
            // Load the image (replace with the path to your image)
            const image = 'logo.png';

            // Set the image position and size
            const x = 0; // X-coordinate (left)
            const y = 0; // Y-coordinate (top)
            const width = 80; // Image width in pixels
            const height = 80; // Image height in pixels
            const lineSpacing = 15;

            // Add the image to the PDF document
            doc.image(image, 10, 10, { width, height });

            // Position the text to appear to the right of the image
            textX = x + width + 20;
            textY = 0;

            doc.font('Helvetica') // Reset to regular font

            doc.fontSize(12).text(`${customerData.fullfillmentDate}`, textX, textY + 10, { align: 'right' });
            textY += lineSpacing
            doc.fontSize(12).text(`Name:        ${customerName}`, textX, textY);
            textY += lineSpacing
            doc.fontSize(12).text(`Phone:       ${customerData.phone}`, textX, textY);
            textY += lineSpacing
            doc.fontSize(12).text(`Drop Site:   ${customerData.fullfillmentName} (${customerData.timeRange})`, textX, textY);
            textY += lineSpacing
            doc.fontSize(12).text(`Address:     ${customerData.fullfillmentAddress}`, textX, textY);
            textY += lineSpacing
            if (customerData.customerNote !== '') {
              doc.fontSize(12).text(`Customer Note:  ${customerData.customerNote}`, textX, textY, { bold: true });
            }

            // Rset Document
            doc.x = 10
            doc.y = 120

            doc.fontSize(16).text('Items Ordered', { bold: true });

            const items = customerData.products;

            // Sort the dataset by the 'vendor' property
            items.sort((a, b) => {
              if (a.vendor < b.vendor) {
                return -1; // a should come before b
              } else if (a.vendor > b.vendor) {
                return 1; // a should come after b
              }
              return 0; // a and b are equal in terms of 'vendor'
            });


            // Set the table column widths
            const itemsAsData = items.map(item => [item.product, item.quantity, item.itemUnit, item.vendor]);

            const pageWidth = 600

            table = {
              title: '',
              widths: [pageWidth], // Set the width to the page width
              headers: ['Product', 'Quantity', 'Unit', 'Vendor', 'Packed'],
              rows: itemsAsData,
            };

            doc.table(table);

            doc.moveDown();

            doc.fontSize(8).font('Helvetica-Oblique').text(' Missing an item? Send an email to fullfarmcsa@deckfamilyfarm.com and we\'ll issue you a credit.', doc.x, doc.y);

            doc.addPage();
          }

        }

        doc.end();
        // Wait for the stream to finish and then resolve with the file path
        doc.on('finish', () => {
          console.log('PDF created successfully.');
          console.log(pdf_file);
        });

        doc.on('error', (error) => {
          console.error('PDF creation error:', error);
          reject(error);
        });

        // TODO: figure out appropriate aync methods to enable finishing PDF creation
        setTimeout(() => {
          console.log("Success!")
          resolve(pdf_file); // Promise is resolved with "Success!"
        }, 1000);
      });
  });
}
// Build customer delivery orders (picklists)
async function delivery_order(fullfillmentDateStart, fullfillmentDateEnd) {
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
          writeDeliveryOrderPDF(orders_file_path)
            .then((delivery_order_pdf) => {
              //utilities.sendEmail(delivery_order_pdf, 'delivery_orders.pdf', 'FFCSA Reports: Delivery Orders for ' + fullfillmentDateEnd)
              // Email information
              const emailOptions = {
                from: "jdeck88@gmail.com",
                to: "fullfarmcsa@deckfamilyfarm.com",
                cc: "jdeck88@gmail.com",
                subject: 'FFCSA Reports: Delivery Orders for ' + fullfillmentDateEnd,
                text: "Please see the attached file.  Reports are generated twice per week in advance of fullfillment dates.",
              };

              // Attach the file to the email
              emailOptions.attachments = [
                {
                  filename: 'delivery_orders.pdf', // Change the filename as needed
                  content: fs.readFileSync(delivery_order_pdf), // Attach the file buffer
                },
              ];
              utilities.sendEmail(emailOptions)

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
delivery_order(utilities.getNextFullfillmentDate().start, utilities.getNextFullfillmentDate().end);
