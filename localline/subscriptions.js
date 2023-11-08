const fs = require('fs');
const fastcsv = require('fast-csv');
const PDFDocument = require('pdfkit-table');
const axios = require('axios');


const utilities = require('./utilities');

async function run(filename, customerData, yesterdayFormatted) {
    return new Promise((resolve, reject) => {
        const pdf_file = 'data/subscriptions_'+yesterdayFormatted+'.pdf';
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
                    rows: combinedData.map(item => [item.id, item.customer,item.email, item.subscription_date, item.level, item.amount]),
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
                    resolve(results); // Promise is resolved with "Success!"
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



module.exports = {
    run,
    populateCustomers
};

/*
run('data/subscriptions_2023-10-31.csv')
    .then((results) => {
        console.log('results:', results.pdf_file);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
    */
