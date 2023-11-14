// Using the following get  the "access" property
var request = require('request');
const fs = require('fs');
const path = require('path');
const utilities = require('./utilities');
require('dotenv').config();
const PDFDocument = require('pdfkit-table');
const axios = require('axios');
const fastcsv = require('fast-csv');


async function run(filename, lastDay) {
    return new Promise((resolve, reject) => {
        const pdf_file = 'data/vendors_' + lastDay + '.pdf';
        const doc = new PDFDocument();

        doc.on('finish', () => {
            console.log('PDF created successfully.');
        });

        doc.on('error', (error) => {
            console.error('PDF creation error:', error);
            reject(error);
        });

        doc.pipe(fs.createWriteStream(pdf_file));
        const vendors = [];

        fs.createReadStream(filename)
            .pipe(fastcsv.parse({ headers: true }))
            .on('data', (row) => {
                if (row['Category'] !== 'Membership') {
                    vendors.push({
                        date: row['Fulfillment Date'],
                        vendor: row['Vendor'],
                        amount: row['Product Subtotal'],
                    });
                }
            })
            .on('end', () => {
                vendors.sort((a, b) => a['vendor'].localeCompare(b['vendor']));
                month = ''
                const months = [
                    'January', 'February', 'March', 'April', 'May', 'June', 'July',
                    'August', 'September', 'October', 'November', 'December'
                ];
                const grouped = {};
                all_vendor_sales = 0
                vendors.forEach((item) => {
                    const { date, vendor, amount } = item;

                    // Parse the date to get the month value and convert it to a full month name
                    const monthAbbreviation = date.split(' ')[1];
                    month = months[new Date(monthAbbreviation + ' 1, 2000').getMonth()];

                    if (!grouped[vendor]) {
                        // Initialize the vendor entry if it doesn't exist
                        grouped[vendor] = {
                            date: month,
                            vendor,
                            amount: parseFloat(amount),
                        };
                    } else {
                        // Add the amount to the existing vendor entry
                        grouped[vendor].amount += parseFloat(amount);
                    }
                    all_vendor_sales = all_vendor_sales + parseFloat(amount)
                });


                // Convert the result object into an array of values
                output = Object.values(grouped);
                output = output.sort((a, b) => b.amount - a.amount);

                const formattedRows = output.map(item => [item.vendor, '$' + item.amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')]);

                doc.text(month + ' Vendor Reports')
                doc.text('Total Sales = ' + all_vendor_sales.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','))
                const table = {
                    title: '',
                    headers: ['vendor', 'amount'],
                    rows: formattedRows,
                };
                doc.table(table);
                doc.end();

                // TODO: figure out appropriate aync methods to enable finishing PDF creation
                setTimeout(() => {
                    console.log("Success!")
                    resolve(pdf_file); // Promise is resolved with "Success!"
                }, 1000);


            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

// Build customer delivery orders (picklists)
async function vendor(lastMonth) {
    try {
        console.log("running monthly vendor report updater")

        url = 'https://localline.ca/api/backoffice/v2/orders/export/?' +
            'file_type=orders_list_view&send_to_email=false&destination_email=fullfarmcsa%40deckfamilyfarm.com&direct=true&' +
            `fulfillment_date_start=${lastMonth.first}&` +
            `fulfillment_date_end=${lastMonth.last}&` +
            '&status=OPEN&status=NEEDS_APPROVAL&status=CANCELLED&status=CLOSED'

        console.log(url)
        data = {}

        // Login
        data = await utilities.getAccessToken();
        const accessToken = JSON.parse(data).access;

        // Call the function and wait for the response
        (async () => {
            try {
                console.log("fetching vendors ...")
                data = await utilities.getRequestID(url, accessToken);
                const id = JSON.parse(data).id;

                // Wait for report to finish
                const vendor_result_url = await utilities.pollStatus(id, accessToken);

                // Download File
                if (vendor_result_url !== "") {
                    utilities.downloadData(vendor_result_url, 'vendors_' + lastMonth.last + ".csv", accessToken)
                        .then((vendor_file_path) => {
                            console.log('Downloaded file path:', vendor_file_path);
                            run(vendor_file_path, lastMonth.last).then((vendors_pdf) => {
                                try {
                                    //utilities.sendEmail(vendors_pdf, 'vendors_' + lastMonth.last+'.pdf', 'FFCSA Reports: Monthly Vendor Report for ' + lastMonth.last)
                                    const emailOptions = {
                                        from: "jdeck88@gmail.com",
                                        to: "fullfarmcsa@deckfamilyfarm.com",
                                        cc: "jdeck88@gmail.com",
                                        subject: 'FFCSA Reports: Monthly Vendor Report for ' + lastMonth.last,
                                        text: "Please see the attached file.",
                                    };

                                    emailOptions.attachments = [
                                        {
                                            filename: 'vendors_' + lastMonth.last + '.pdf', // Change the filename as needed
                                            content: fs.readFileSync(vendors_pdf), // Attach the file buffer
                                        },
                                    ];

                                    utilities.sendEmail(emailOptions)

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

vendor(utilities.getLastMonth());



