const fs = require('fs');
const PDFDocument = require('pdfkit-table');
const fastcsv = require('fast-csv');




function formatDate(inputDate) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Parse the input date string (e.g., "28-Oct-23")
    const parts = inputDate.split('-');
    const day = parseInt(parts[0], 10);
    const monthIndex = months.indexOf(parts[1]);
    const year = 2000 + parseInt(parts[2], 10); // Assuming the year is in 2-digit format

    const date = new Date(year, monthIndex, day);

    // Get the day of the week, month, and day with ordinal suffix
    const dayOfWeek = daysOfWeek[date.getDay()];
    const month = months[date.getMonth()];
    const dayWithSuffix = day + (day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th');

    // Format the date as "Saturday, Oct 28th"
    const formattedDate = `${dayOfWeek}, ${month} ${dayWithSuffix}`;

    return formattedDate;
}

async function writeDeliveryOrderPDF(filename) {
    return new Promise((resolve, reject) => {

        const pdf_file = 'delivery_order.pdf'
        // Create a new PDF document
        const doc = new PDFDocument();
        console.log(pdf_file)
        doc.pipe(fs.createWriteStream(pdf_file));
        console.log('found PDF file')

        // Initialize variables to group items by "Fulfillment Name"
        const customers = {}; // Store customer data including attributes
        let currentCustomerName = null;

        const sortedData = [];

        // Read the CSV file and sort by "Customer Name" before processing
        console.log(filename)
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
                    const product = row['Product'];
                    const quantity = row['Quantity'];

                    const category = row['Category']
                    const customerPhone = row['Phone']
                    const fullfillmentName = row['Fulfillment Name']
                    const fullfillmentAddress = row['Fulfillment Address']
                    const fullfillmentDate = formatDate(row['Fulfillment Date'])
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
                        customers[customerName].products.push({ product, quantity });
                    }

                });

                // Iterate through items and generate the PDF content
                for (const customerName in customers) {
                    const customerData = customers[customerName];

                    if (customerData.products.length > 0) {
                        doc.font('Helvetica') // Reset to regular font

                        doc.fontSize(12).text(`${customerData.fullfillmentDate}`, { align: 'right' });

                        doc.fontSize(12).text(`Name:        ${customerName}`);
                        doc.fontSize(12).text(`Phone:       ${customerData.phone}`);
                        doc.fontSize(12).text(`Drop Site:   ${customerData.fullfillmentName} (${customerData.timeRange})`);
                        doc.fontSize(12).text(`Address:     ${customerData.fullfillmentAddress}`);

                        doc.moveDown();

                        if (customerData.customerNote !== '') {
                            doc.fontSize(12).text(`Customer Note:  ${customerData.customerNote}`, { bold: true });
                        }

                        doc.moveDown();

                        doc.fontSize(16).text('Items Ordered', { bold: true });

                        const items = customerData.products;

                        // Set the table column widths
                        const itemsAsData = items.map(item => [item.product, item.quantity]);

                        table = {
                            title: '',
                            headers: ['Product', 'Quantity', 'Packed'],
                            rows: itemsAsData,
                        };

                        doc.table(table);

                        doc.moveDown();

                        doc.fontSize(8).font('Helvetica-Oblique').text(' Missing an item? Send an email to fullfarmcsa@deckfamilyfarm.com and we\'ll issue you a credit.', 75, doc.y);

                        doc.addPage();
                    }

                }

                doc.end();
                // Wait for the stream to finish and then resolve with the file path
                doc.on('finish', () => {
                    console.log('PDF created successfully.');
                    console.log(pdf_file);
                    resolve(pdf_file);
                });

                doc.on('error', (error) => {
                    console.error('PDF creation error:', error);
                    reject(error);
                });
            });
    });
}

module.exports = {
    writeDeliveryOrderPDF,
    formatDate
};

// Example usage:
writeDeliveryOrderPDF('data/orders_list_view_full_farm_csa_26_Oct_2023.csv')
  .then((pdfFilePath) => {
    console.log('PDF file path:', pdfFilePath);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
//pdf_file = writeDeliveryOrderPDF('data/orders_list_view_full_farm_csa_26_Oct_2023.csv_jiOoe.csv')
