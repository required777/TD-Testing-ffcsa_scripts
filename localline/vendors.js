var request = require('request');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const PDFDocument = require('pdfkit-table');
const fastcsv = require('fast-csv');
const utilities = require('./utilities');
const ExcelJS = require('exceljs');


async function writeVendorsPDF(products_file_path, filename) {
    return new Promise((resolve, reject) => {
        const pdf_file = 'data/vendors.pdf'

        // Create a new PDF document
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(pdf_file));

        // Initialize variables to group items by "Fulfillment Name"
        const vendors = {}; // Store customer data including attributes
        let currentVendorName = null;

        const sortedData = [];


        readVendorsExcel(products_file_path)
            .then((products_data) => {
                //console.log(products_data)
                //resolve('')
                // Read the CSV file and sort by "Customer Name" before processing
                fs.createReadStream(filename)
                    .pipe(fastcsv.parse({ headers: true }))
                    .on('data', (row) => {
                        sortedData.push(row);
                    })
                    .on('end', () => {
                        // Sort the data by "Customer Name"
                        sortedData.sort((a, b) => a['Vendor'].localeCompare(b['Vendor']));

                        // Process the sorted data
                        sortedData.forEach((row) => {
                            const productID = row['Product ID']
                            const vendorName = row['Vendor']
                            const product = row['Item Unit'] + ',' + row['Product'] + ' - ' + row['Package Name'];
                            const quantity = Math.round(parseFloat(row['Quantity']));
                            const price = (parseFloat(row['Product Subtotal']) / quantity).toFixed(2);
                            const totalPrice = row['Product Subtotal']
                            const category = row['Category']
                            const fullfillmentDate = row['Fulfillment Date']


                            // If the customerName changes, start a new section
                            if (vendorName !== currentVendorName) {
                                currentVendorName = vendorName;
                                vendors[vendorName] = {
                                    products: []
                                };
                            }



                            //console.log(mergedObject)
                            if (category !== 'Membership') {
                                vendors[vendorName].products.push({ productID, product, quantity, price, totalPrice, fullfillmentDate });
                            }
                        });

                        // Iterate through items and generate the PDF content
                        for (const vendorName in vendors) {
                            const vendorData = vendors[vendorName];

                            if (vendorData.products.length > 0) {




                                const items = vendorData.products;

                                // Sort the dataset by the 'product' property
                                items.sort((a, b) => {
                                    if (a.product < b.product) {
                                        return -1; // a should come before b
                                    } else if (a.product > b.product) {
                                        return 1; // a should come after b
                                    }
                                    return 0; // a and b are equal in terms of 'vendor'
                                });

                                // Update price and total price based on vendor pricing
                                for (const itemRow of items) {
                                    productID = parseInt(itemRow.productID, 10);
                                    product = itemRow.product;
                                    quantity = itemRow.quantity;
                                    fullfillmentDate = itemRow.fullfillmentDate;

                                    itemRow.price = lookupPackagePrice(productID, products_data);
                                    itemRow.totalPrice = quantity * itemRow.price;
                                }

                                fullfillmentDate = utilities.formatDate(fullfillmentDate)
                                doc.fontSize(16).text(fullfillmentDate, { align: 'right' });
                                doc.fontSize(16).text(vendorName, { bold: true });

                                // Set the table column widths
                                const itemsAsData = items.map(item => [item.product, item.quantity, item.price, item.totalPrice]);

                                // Create an object to store the summary
                                const summary = {};
                                sumTotal = 0;
                                // Iterate through the data and update the summary
                                itemsAsData.forEach((row) => {
                                    const key = row[0];
                                    const quantity = parseInt(row[1], 10);
                                    const price = parseFloat(row[2])
                                    const totalPrice = parseFloat(row[3]);

                                    if (!summary[key]) {
                                        summary[key] = { quantity: 0, price: 0, totalPrice: 0 };
                                    }

                                    summary[key].quantity += quantity;
                                    summary[key].price = price;
                                    summary[key].totalPrice += totalPrice;

                                    sumTotal += totalPrice
                                });



                                // Convert the summary object to an array of arrays
                                const grouped = Object.entries(summary).map(([key, values]) => [key, values.quantity, values.price, values.totalPrice.toFixed(2)]);

                                const pageWidth = 600

                                table = {
                                    title: '',
                                    widths: [pageWidth], // Set the width to the page width
                                    headers: ['Product', 'Quantity', 'Price', 'Total Price', 'Received'],
                                    rows: grouped,
                                };

                                doc.table(table);
                                doc.text('Total Price ' + sumTotal.toFixed(2), { align: 'right', bold: true })

                                doc.addPage();
                            }
                        }

                        doc.end();
                        // Wait for the stream to finish and then resolve with the file path
                        doc.on('finish', () => {
                            console.log('PDF created successfully.');
                            //console.log(pdf_file);
                        });

                        doc.on('error', (error) => {
                            console.error('PDF creation error:', error);
                            throw new Error("PDF creation error")
                            reject(error);
                        });

                        // TODO: figure out appropriate aync methods to enable finishing PDF creation
                        setTimeout(() => {
                            console.log("Success!")
                            resolve(pdf_file); // Promise is resolved with "Success!"
                        }, 1000);
                    });
            });
    })
}

function lookupPackagePrice(productID, productsData) {
    const product = productsData.find((product) => product['Local Line Product ID'] === productID);
    if (product) {
        return product['Package Price'];
    }

    return null; // Return null if no matching product is found
}

async function readVendorsExcel(filePath) {
    try {
        const workbook = new ExcelJS.Workbook();
        //console.log('read ' + filePath)
        const dataArray = [];

        await workbook.xlsx.readFile(filePath)
        // Assuming the data is in the second sheet
        const worksheet = workbook.getWorksheet(2);

        // Get the attribute names from the first row (header)
        const attributeNames = worksheet.getRow(1).values;

        // Create an array of objects with attribute names as keys
        for (let rowNumber = 2; rowNumber <= worksheet.actualRowCount; rowNumber++) {
            const row = worksheet.getRow(rowNumber).values;
            const obj = {};
            for (let i = 1; i < attributeNames.length; i++) {
                obj[attributeNames[i]] = row[i];
            }
            dataArray.push(obj);
        }

        //console.log('dataArray')
        //console.log(dataArray);
        return dataArray

    } catch (error) {
        throw new Error(error)
    }

}

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
                writeVendorsPDF(products_file, delivery_order_file_path)
                    .then((vendors_pdf) => {

                        // Email information
                        const emailOptions = {
                            from: "jdeck88@gmail.com",
                            to: "jdeck88@gmail.com",
                            //to: "fullfarmcsa@deckfamilyfarm.com",
                            //cc: "jdeck88@gmail.com",
                            subject: 'FFCSA Reports: Vendors Data for ' + fullfillmentDate,
                            text: "Please see the attached file.  Reports are generated twice per week in advance of fullfillment dates.",
                        };

                        // Attach the file to the email
                        emailOptions.attachments = [
                            {
                                filename: "vendors.pdf",
                                content: fs.readFileSync(vendors_pdf),
                            }]

                        utilities.sendEmail(emailOptions)

                    }).catch((error) => {
                        console.error("Error in writeChecklistPDF:", error);
                    });
            })
            .catch((error) => {
                console.log('error fetching vendorsfile, continuing to run checklist process using local copy as this file often halts....');
                utilities.sendErrorEmail(error)
                /*writeVendorsPDF(products_file, delivery_order_file_path)
                   .then((vendors_pdf) => {
                     utilities.sendEmail(vendors_pdf, 'vendors.pdf', 'FFCSA Reports: Vendorts Data for ' + fullfillmentDate)
                   }).catch((error) => {
                     console.error("Error in writeChecklistPDF:", error);
                   });
                   */
            })


    } catch (error) {
        console.error('A general occurred:', error);
    }
}

// Run the checklist script
//fullfillmentDate = '2023-10-31'
fullfillmentDateObject = utilities.getNextFullfillmentDate()
vendors(fullfillmentDateObject.date);