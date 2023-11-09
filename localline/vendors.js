const fs = require('fs');
const fastcsv = require('fast-csv');
const PDFDocument = require('pdfkit-table');
const axios = require('axios');
const utilities = require('./utilities');

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
                    rows:formattedRows,
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

module.exports = {
    run
};


run('data/vendors_2023-10-31.csv', '2023-10-31')
    .then((results) => {
        console.log('results:', results);
    })
    .catch((error) => {
        console.error('Error:', error);
    });

