const fs = require('fs');
const PDFDocument = require('pdfkit-table');
const fastcsv = require('fast-csv');
const utilities = require('./utilities');
const ExcelJS = require('exceljs');


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

                            // If the customerName changes, start a new section
                            if (vendorName !== currentVendorName) {
                                currentVendorName = vendorName;
                                vendors[vendorName] = {
                                    products: []
                                };
                            }



                            //console.log(mergedObject)
                            if (category !== 'Membership') {
                                vendors[vendorName].products.push({ productID, product, quantity, price, totalPrice });
                            }
                        });

                        // Iterate through items and generate the PDF content
                        for (const vendorName in vendors) {
                            const vendorData = vendors[vendorName];

                            if (vendorData.products.length > 0) {

                                doc.fontSize(16).text(vendorName, { bold: true });

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
                                    itemRow.price = lookupPackagePrice(productID, products_data);
                                    itemRow.totalPrice = quantity * itemRow.price;
                                }

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
/*
This function creates the following
1. a checklist for each dropsite showing totes, dairy, frozen
2. a master checklist
3. a packlist of frozen products by customer for each dropsite
4. a dairy packlist for all dropsites
*/
async function writeChecklistPDF(dairy_file_path, frozen_file_path, delivery_order_file_path) {
    return new Promise((resolve, reject) => {
        const pdf_file = 'data/dropsite_checklist.pdf'
        // Create a new PDF document
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(pdf_file))

        // Initialize variables to group items by "Fulfillment Name"
        const dropsites = {};
        const dropsitesAll = {};

        const masterdropsites = {};
        const customers = {}
        let currentDropsiteName = null;
        let currentCustomerName = null;
        fullfillmentDate = ''

        const sortedData = [];

        readLocalExcelAndExtractColumnData(dairy_file_path)
            .then((dairy_ids) => {
                readLocalExcelAndExtractColumnData(frozen_file_path)
                    .then((frozen_ids) => {
                        // read the delivery orders 
                        fs.createReadStream(delivery_order_file_path)
                            .pipe(fastcsv.parse({ headers: true }))
                            .on('data', (row) => {
                                sortedData.push(row);
                            })
                            .on('end', () => {
                                // Sort the data by "Fullfillment Name"
                                sortedData.sort((a, b) => a['Fulfillment Name'].localeCompare(b['Fulfillment Name']));

                                // update the disposition field
                                sortedData.forEach((item) => {
                                    item.disposition = "tote";
                                });
                                updatedData = updateCategoryForProductID(sortedData, dairy_ids, 'dairy');
                                updatedData = updateCategoryForProductID(updatedData, frozen_ids, 'frozen');

                                updatedData.sort((a, b) => a['Fulfillment Name'].localeCompare(b['Fulfillment Name']));

                                // We want to create an array of dropsites that contains an array of customers (the dropsite)
                                // contains just the dropsite name and the customers contain the Customer, Phone
                                updatedData.forEach((row) => {
                                    dropsiteName = row['Fulfillment Name']
                                    disposition = row['disposition']
                                    customerName = row['Customer']
                                    fullfillmentDate = utilities.formatDate(row['Fulfillment Date'])
                                    customerPhone = row['Phone']
                                    category = row['Membership']
                                    quantity = Math.round(parseFloat(row['Quantity']));
                                    //product = row['Product'];
                                    product = row['Product'] + ' - ' + row['Package Name'];

                                    itemUnit = row['Item Unit']
                                    vendor = row['Vendor']

                                    if (dropsiteName !== currentDropsiteName) {
                                        currentDropsiteName = dropsiteName;
                                        dropsites[dropsiteName] = {
                                            customers: []
                                        };
                                        masterdropsites[dropsiteName] = []
                                        dropsitesAll[dropsiteName] = {
                                            customers: []
                                        };
                                    }

                                    if (customerName !== currentCustomerName) {
                                        currentCustomerName = customerName
                                        dropsites[dropsiteName].customers[customerName] = []
                                        dropsitesAll[dropsiteName].customers[customerName] = []

                                    }

                                    dropsites[dropsiteName].customers[customerName].push({
                                        name: customerName,
                                        phone: customerPhone,
                                        quantity: quantity,
                                        product: product,
                                        itemUnit: itemUnit,
                                        disposition: disposition
                                    });
                                    dropsitesAll[dropsiteName].customers[customerName].push({
                                        name: customerName,
                                        phone: customerPhone,
                                        quantity: quantity,
                                        product: product,
                                        itemUnit: itemUnit,
                                        disposition: disposition
                                    });
                                });
                                dispositionCounts = {}

                                // Iterate through items and generate the PDF content
                                for (const dropsiteName in dropsites) {
                                    const dropsiteData = dropsites[dropsiteName];

                                    // Group and sum the "disposition" values
                                    for (const customerName in dropsites[dropsiteName].customers) {
                                        customerData = dropsites[dropsiteName].customers[customerName]
                                        quantity = customerData[0].quantity

                                        dispositionCounts = customerData.reduce((accumulator, item) => {
                                            const disposition = item.disposition;
                                            if (disposition === 'dairy') {
                                                accumulator[disposition] = (accumulator[disposition] || 0) + item.quantity;
                                            } else if (disposition === 'tote' || disposition === 'frozen') {
                                                accumulator[disposition] = 1
                                            }
                                            return accumulator;
                                        }, {});

                                        dropsites[dropsiteName].customers[customerName] = { ...customerData.customers, ...dispositionCounts }
                                    }
                                }

                                count = 0
                                for (const dropsiteName in dropsites) {
                                    if (count > 0) {
                                        doc.addPage();
                                    }
                                    count++
                                    doc.fontSize(12).text(fullfillmentDate, { align: 'right' });

                                    doc.fontSize(16).text(dropsiteName + " Checklist", { bold: true });

                                    // Convert the data into the desired format
                                    const tableData = Object.entries(dropsites[dropsiteName].customers).map(([name, values]) => ({
                                        name,
                                        tote: values.tote || '',
                                        dairy: values.dairy || '',
                                        frozen: values.frozen || ''
                                    }));
                                    masterdropsites[dropsiteName] = (tableData)
                                    const tableOptions = {
                                        headers: ['Name', 'Tote', 'Dairy', 'Frozen'],
                                        rows: tableData.map((row) => [row.name, row.tote, row.dairy, row.frozen]),
                                    };

                                    doc.table(tableOptions);
                                }


                                // Master Checklist Table
                                for (const dropsiteName in masterdropsites) {
                                    dropsiteData = masterdropsites[dropsiteName]
                                    const sums = dropsiteData.reduce(
                                        (accumulator, current) => {
                                            accumulator.tote += current.tote || 0;
                                            accumulator.dairy += current.dairy || 0;
                                            accumulator.frozen += current.frozen || 0;
                                            return accumulator;
                                        },
                                        { tote: 0, dairy: 0, frozen: 0 }
                                    );

                                    masterdropsites[dropsiteName] = sums
                                }
                                doc.addPage();
                                doc.fontSize(16).text("Master Checklist", { bold: true });
                                const tableData = [
                                    ...Object.entries(masterdropsites).map(([dropsite, values]) => [dropsite, values.tote, values.dairy, values.frozen]),
                                ];
                                // Define the table options
                                const tableOptions = {
                                    headers: ['Dropsite', 'Tote', 'Dairy', 'Frozen'],
                                    rows: tableData
                                };
                                doc.table(tableOptions);
                                doc.addPage();

                                // Product specific Packlist
                                productSpecificPackList(doc, dropsitesAll, 'frozen')
                                doc.addPage();
                                productSpecificPackList(doc, dropsitesAll, 'dairy')

                                doc.end();
                                // Wait for the stream to finish and then resolve with the file path
                                doc.on('finish', () => {
                                    console.log('PDF created successfully.');
                                    resolve(pdf_file)
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

                            })

                    })

                    .catch((error) => {
                        console.error('Error:', error);
                    });

            })
            .catch((error) => {
                console.error('Error:', error);
            });

    });

}

function productSpecificPackList(doc, dropsitesAll, disposition) {

    count = 0;
    for (const dropsiteName in dropsitesAll) {
        const selectedCustomers = {};
        for (const customerName in dropsitesAll[dropsiteName].customers) {
            const customerData = dropsitesAll[dropsiteName].customers[customerName];
            const frozenProducts = customerData.filter((product) => product.disposition === disposition);

            if (frozenProducts.length > 0) {
                selectedCustomers[customerName] = frozenProducts;
            }
        }
        // only print dropsites that have desired product
        if (Object.keys(selectedCustomers).length > 0) {
            if (count > 0) {
                doc.addPage();
            }
            doc.fontSize(14).text(dropsiteName + " " + disposition.charAt(0).toUpperCase() + disposition.slice(1) + " Product Packlist", { bold: true });
            doc.moveDown();

            for (const customerName in selectedCustomers) {
                customerData = selectedCustomers[customerName]

                const tableData = [
                    ...Object.entries(customerData).map(([dropsite, values]) => [
                        values.product,
                        values.itemUnit,
                        values.quantity,
                    ]),
                ];

                if (tableData.length > 0) {
                    // Define the table options
                    const tableOptions = {
                        headers: [customerName, '', ''],
                        rows: tableData
                    };

                    addPageIfNecessary(dropsiteName, tableData, doc);
                    doc.table(tableOptions);
                    // doc.moveDown();

                }
                count++
            }
        }
    }
}

// Function to add a new page if the remaining space is less than the table height
function addPageIfNecessary(dropsiteName, data, doc) {
    //threshold = 100
    const cellHeight = 50; // Set your desired cell height
    const totalRowsHeight = data.length * cellHeight;
    const headerHeight = cellHeight; // Assuming header height is the same as cell height
    const tableHeight = totalRowsHeight + headerHeight;

    remainingHeight = doc.page.height - doc.y

    if (tableHeight > remainingHeight) {
        doc.addPage();
        doc.text(dropsiteName + " (next page...)")
    }
}

function updateCategoryForProductID(jsonData, productIDsToUpdate, value) {
    jsonData.forEach((item) => {
        product_id_string = item['Product ID'].toString().trim();

        if (productIDsToUpdate.includes(product_id_string)) {
            item.disposition = value;
        }
    });
    return jsonData;
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
        throw error;
    }

}

async function readLocalExcelAndExtractColumnData(filePath) {
    try {
        // Load the Excel workbook from the local file
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        // Get the first worksheet
        const worksheet = workbook.worksheets[0]; // Assuming the first worksheet

        // Find the column index for "Local Line Product ID"
        const headerRow = worksheet.getRow(1);
        let columnIndex = -1;
        headerRow.eachCell((cell, colNumber) => {
            if (cell.value === 'Local Line Product ID') {
                columnIndex = colNumber;
            }
        });

        if (columnIndex === -1) {
            throw new Error('Column "Local Line Product ID" not found');
        }

        // Populate an array with the values in the "Local Line Product ID" column
        const localLineProductIDs = [];
        for (let i = 2; i <= worksheet.rowCount; i++) {
            const cell = worksheet.getCell(i, columnIndex);
            localLineProductIDs.push(cell.value.toString());
        }

        return localLineProductIDs;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    writeDeliveryOrderPDF,
    writeChecklistPDF,
    writeVendorsPDF
};

/*
// Example usage:
writeDeliveryOrderPDF('data/orders_list_view_full_farm_csa_26_Oct_2023.csv')
    .then((pdfFilePath) => {
        console.log('PDF file path:', pdfFilePath);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
*/

// Example usage:
/*
writeChecklistPDF('data/dairy.xlsx', 'data/frozen.xlsx', 'data/orders_list_2023-10-31.csv')
    .then((pdfFilePath) => {
        console.log('PDF file path:', pdfFilePath);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
    */
/*writeVendorsPDF('data/orders_list_2023-10-31.csv')
    .then((pdfFilePath) => {
        console.log('PDF file path:', pdfFilePath);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
    */