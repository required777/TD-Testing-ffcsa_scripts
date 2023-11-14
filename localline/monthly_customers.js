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
        const pdf_file = 'data/customers_' + lastDay + '.pdf';
        const customers = [];

        fs.createReadStream(filename)
            .pipe(fastcsv.parse({ headers: true }))
            .on('data', (row) => {
                customers.push({
                    amount: row['Store Credit']
                });
            })
            .on('end', () => {

                all_customer_sales = 0
                customers.forEach((item) => {
                    const { amount } = item;
                    all_customer_sales = all_customer_sales + parseFloat(amount)
                });

                formattedBalance = all_customer_sales.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

                // TODO: figure out appropriate aync methods to enable finishing PDF creation
                setTimeout(() => {
                    console.log("Success!")
                    resolve(formattedBalance); // Promise is resolved with "Success!"
                }, 1000);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

// Build customer delivery orders (picklists)
async function customers(today) {
    try {
        console.log("running monthly customer balance report")

        url = 'https://localline.ca/api/backoffice/v2/customers/export/?direct=true'
        console.log(url)
        data = {}

        // Login
        data = await utilities.getAccessToken();
        const accessToken = JSON.parse(data).access;

        // Call the function and wait for the response
        (async () => {
            try {
                console.log("fetching customers ...")

                // Download File
                if (url !== "") {
                    utilities.downloadBinaryData(url, 'customers_' + today + ".csv", accessToken)
                        .then((customer_file_path) => {
                            console.log('Downloaded file path:', customer_file_path);
                            run(customer_file_path, today).then((balance) => {
                                try {
                                    const emailOptions = {
                                        from: "jdeck88@gmail.com",
                                        //to: "fullfarmcsa@deckfamilyfarm.com",
                                        to: "jdeck88@gmail.com",
                                        subject: 'FFCSA Reports: Monthly Customer Balance Report for ' + today,
                                        text: "Total Member Balance as of " + today + " = " + balance,
                                    };
                                   
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

//today = '2023-10-31'
customers(utilities.getToday());



