const fs = require('fs');
const fastcsv = require('fast-csv');
const PDFDocument = require('pdfkit-table');

const utilities = require('./utilities');

async function run(filename) {
    return new Promise((resolve, reject) => {
        const pdf_file = 'data/subscriptions.pdf';
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
                        'Package Name': row['Package Name'],
                        'Product Subtotal': row['Product Subtotal'],
                    });
                }
            })
            .on('end', () => {
                subscribers.sort((a, b) => a['Package Name'].localeCompare(b['Package Name']));

                const items = subscribers.map((subscriber) => ({
                    subscription_date: subscriber['Date'],
                    customer: subscriber['Customer'],
                    level: subscriber['Package Name'],
                    amount: subscriber['Product Subtotal'],
                }));

                const table = {
                    title: '',
                    headers: ['Subscription Date', 'Customer', 'Level', 'Total'],
                    rows: items.map(item => [item.subscription_date, item.customer, item.level, item.amount]),
                };
                //console.log(items)
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

module.exports = {
    run
};

/*
run('data/subscriptions_2023-10-31.csv')
    .then((results) => {
        console.log('results:', results);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
    */
