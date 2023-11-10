// Using the following get  the "access" property
var request = require('request');
const fs = require('fs');
const path = require('path');
const fastcsv = require('fast-csv');
const PDFDocument = require('pdfkit-table');
const axios = require('axios');
const utilities = require('./utilities');

require('dotenv').config();

async function run(filename, customerData, yesterdayFormatted) {
    return new Promise((resolve, reject) => {
        const pdf_file = 'data/subscriptions_' + yesterdayFormatted + '.pdf';
        const doc = new PDFDocument();

        doc.on('finish', () => {
            console.log('PDF created successfully.');
        });

        doc.on('error', (error) => {
            console.error('PDF creation error:', error);
            reject(error);
        });

        doc.pipe(fs.createWriteStream(pdf_file));
        const subscribers = [];

        fs.createReadStream(filename)
            .pipe(fastcsv.parse({ headers: true }))
            .on('data', (row) => {
                const productSubtotal = parseFloat(row['Product Subtotal']);
                if ([200.00, 300.00, 500.00].includes(productSubtotal)) {
                    subscribers.push({
                        Date: row['Date'],
                        Customer: row['Customer'],
                        email: row['Email'],
                        'Package Name': row['Package Name'],
                        'Product Subtotal': row['Product Subtotal'],
                    });
                }
            })
            .on('end', () => {
                subscribers.sort((a, b) => a['Package Name'].localeCompare(b['Package Name']));

                // Combine the two arrays based on the "email" field and add "id" to the subscribers array
                const combinedData = subscribers.map(subscriber => {
                    const customer = customerData.find(cust => cust.email === subscriber.email);
                    return {
                        id: customer ? customer.id : null,
                        customer: subscriber.Customer,
                        email: subscriber.email,
                        subscription_date: subscriber.Date,
                        level: subscriber['Package Name'],
                        amount: subscriber['Product Subtotal'],
                    };
                });

                ///console.log(combinedData);


                const table = {
                    title: '',
                    headers: ['CustomerID', 'Customer', 'Email', 'Subscription Date', 'Level', 'Total'],
                    rows: combinedData.map(item => [item.id, item.customer, item.email, item.subscription_date, item.level, item.amount]),
                };
                doc.table(table);
                doc.end();


                // TODO: In this loop pull out id and call IP to increment by set amount
                num_subscriptions = 0;
                for (const entry of combinedData) {
                    console.log(`ID: ${entry.id}, Amount: ${entry.amount}  ${entry.email}`);
                    num_subscriptions = num_subscriptions + 1
                }
                console.log(num_subscriptions + " subscriptions made")

                const results = {
                    count: num_subscriptions,
                    pdf_file: pdf_file
                };

                // TODO: figure out appropriate aync methods to enable finishing PDF creation
                setTimeout(() => {
                    console.log("Success!")
                    resolve(results);
                }, 1000);


            })
            .on('error', (error) => {
                reject(error);
            });
    });
}


async function populateCustomers(accessToken) {
    apiUrl = 'https://localline.ca/api/backoffice/v2/customers/?page=1&page_size=50'; // Initial API URL

    let allCustomers = []; // Array to store customer data

    while (apiUrl) {
        try {
            const headers = {
                'Authorization': `Bearer ${accessToken}`
            };

            const response = await axios.get(apiUrl, {
                headers: headers
            });

            const { results, next } = response.data;

            // Extract and push "id" and "email" of each customer to the array
            results.forEach(customer => {
                allCustomers.push({ id: customer.id, email: customer.email });
            });

            // Check if there is a next page
            apiUrl = next ? next : null;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw new Error(error)
        }
    }

    // Now, allCustomers array contains the "id" and "email" of all customers
    return allCustomers; // Return the array when done

}

async function subscriptions(yesterday) {
    try {
        console.log("running subscriptions updater")

        url = 'https://localline.ca/api/backoffice/v2/orders/export/?' +
            'file_type=orders_list_view&' +
            'send_to_email=false&destination_email=fullfarmcsa%40deckfamilyfarm.com&direct=true&' +
            `start_date=${yesterday}&` +
            `end_date=${yesterday}&` +
            'payment__status=PAID&payment__status=AUTHORIZED&' +
            'vendors=3148&price_lists=2719&status=OPEN'

        data = {}

        // Login
        data = await utilities.getAccessToken();
        const accessToken = JSON.parse(data).access;


        // Call the function and wait for the response
        (async () => {
            try {
                console.log("fetching customers ...")
                const customerData = await populateCustomers(accessToken);
                //console.log('Customer data:', customerData);

                // TODO: validate customerData makes sense
                data = await utilities.getRequestID(url, accessToken);
                const id = JSON.parse(data).id;

                // Wait for report to finish
                const subscription_result_url = await utilities.pollStatus(id, accessToken);

                // Download File
                if (subscription_result_url !== "") {
                    utilities.downloadData(subscription_result_url, 'subscriptions_' + yesterday + ".csv", accessToken)
                        .then((subscription_file_path) => {
                            console.log('Downloaded file path:', subscription_file_path);
                            run(subscription_file_path, customerData, yesterday)
                                .then((results) => {
                                    try {

                                        bodytext = "Please see the attached file.  Subscribers report is run daily."
                                        if (parseInt(results.count) < 1) {
                                            bodytext = "No new subscribers this day. No file to attach"
                                        }

                                        // Email information
                                        const emailOptions = {
                                            from: "jdeck88@gmail.com",
                                            to: "jdeck88@gmail.com",
                                            subject: 'Subscriptions made on ... ' + yesterday,
                                            text: bodytext,
                                        };

                                        if (results.count > 0) {
                                            emailOptions.attachments = [
                                                {
                                                    filename: 'subscriptions_' + yesterday + '.pdf', 
                                                    content: fs.readFileSync(results.pdf_file), 
                                                },
                                            ];
                                        }
                                        //utilities.sendSubscribersEmail(results, 'subscriptions_' + yesterday + '.pdf', 'Subscriptions made on ... ' + yesterday)
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

subscriptions(utilities.getYesterday());