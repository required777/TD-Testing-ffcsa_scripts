// Using the following get  the "access" property
var request = require('request');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const PDFDocument = require('pdfkit-table');
const fastcsv = require('fast-csv');
const ExcelJS = require('exceljs');
const utilities = require('./utilities');
const { createObjectCsvWriter } = require('csv-writer');

async function subscribers(filename ) {
	return new Promise((resolve, reject) => {
		const sortedData = [];
		// Read the CSV file and sort by "Customer Name" before processing
		fs.createReadStream(filename)
			.pipe(fastcsv.parse({ headers: true }))
			.on('data', (row) => {
				sortedData.push(row);
			})
			.on('end', () => {
				// Initialize variables to store the count and sum
				let activeMembersCount = 0;
				let totalAmountForActiveMembers = 0;

				// Iterate through sortedData to count active members and sum 'Total' column
				sortedData.forEach(row => {
					// Check if the status is 'Active'
					if (row.Status === 'Active') {
						activeMembersCount++;

						// Extract the 'Total' column value and add it to the sum
						const total = parseFloat(row.Total);
						if (!isNaN(total)) {
							totalAmountForActiveMembers += total;
						}
					}
				});

				salesData.totalActiveSubscribers = activeMembersCount;
				salesData.projectedMonthlySubscriptionRevenue = totalAmountForActiveMembers;				
			});
	});
}


async function orders(filename, start, end) {
	return new Promise((resolve, reject) => {
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


				// Initialize variables to store total items and total order amount
				let totalItems = 0;
				let totalOrderAmount = 0;
				let overallAmountPaid = 0;


				// Count number of unique orders and calculate total items and total order amount
				const uniqueOrderIDs = new Set();
				sortedData.forEach(row => {
					const orderID = row.Order;
					if (!uniqueOrderIDs.has(orderID)) {
						uniqueOrderIDs.add(orderID);
						totalOrderAmount += parseFloat(row['Order Total']); // Assuming 'Order Total' is the column containing order total
					}
					totalItems += 1
					const productSubtotal = parseFloat(row['Product Subtotal']);
					overallAmountPaid += productSubtotal;
				});

				const uniqueOrderCount = uniqueOrderIDs.size;
				const averageItemsPerOrder = totalItems / uniqueOrderCount;
				const averageOrderAmount = totalOrderAmount / uniqueOrderCount;

				// Count number of unique orders made by guests
				// Initialize a Set to store unique order IDs made by guests
				const uniqueGuestOrders = new Set();
				sortedData.forEach(row => {
					const orderID = row.Order;
					const priceList = row['Price List'];

					// Check if the price list contains 'Guest'
					if (priceList.includes('Guest')) {
						uniqueGuestOrders.add(orderID);
					}
				});

				// Get the count of unique orders made by guests
				const uniqueGuestOrderCount = uniqueGuestOrders.size;
				salesData.totalSales = overallAmountPaid.toFixed(2);
				salesData.numOrders = uniqueOrderCount;
				salesData.numGuestOrders =  uniqueGuestOrderCount;
				salesData.numSubscriberOrders = Math.round(uniqueOrderCount - uniqueGuestOrderCount);
				salesData.averageItemsPerOrder = Math.round(averageItemsPerOrder);
				salesData.averageOrderAmount = averageOrderAmount.toFixed(2);

			});
	});
}
// Build customer delivery orders (picklists)
async function run(start, end) {
	try {
		

		data = {}
		// Login
		data = await utilities.getAccessToken();
		const accessToken = JSON.parse(data).access;

		// Download and Process Order Data
		url = 'https://localline.ca/api/backoffice/v2/orders/export/?' +
			'file_type=orders_list_view&send_to_email=false&direct=true&' +
			`fulfillment_date_start=${start}&` +
			`fulfillment_date_end=${end}&` +
			'payment__status=PAID&price_lists=2966%2C2718%2C3124&status=OPEN'
		data = await utilities.getRequestID(url, accessToken);
		id = JSON.parse(data).id;
		results_url = await utilities.pollStatus(id, accessToken);
		orders_file_path = await utilities.downloadData(results_url, 'kpi_orders_list_' + end + ".csv")
		orders(orders_file_path, start,end).then(result => {
        	console.log('orders finished');
		})
		.catch(error => {
        	console.error(error);
		});

		// Download and Process Subscriber Data
		url = 'https://localline.ca/api/backoffice/v2/order-subscriptions/export/'
		file_path = await utilities.downloadBinaryData(url, 'subscribers.csv', accessToken)
		subscribers(file_path).then(result => {
        	console.log('subscribers finished');
    	})
    	.catch(error => {
        	console.error(error);
    	});

 		setTimeout(() => {
			subjectString =  'FFCSA Reports: Weekly KPIs for ' + start + " to " + end;
			appendToCSV(salesData,start,end);
			console.log(subjectString);
			console.log(salesData)
			const emailOptions = {
				from: "jdeck88@gmail.com",
				to: "jdeck88@gmail.com",
				subject: subjectString,
				text: JSON.stringify(salesData, null, 4)
			};
			utilities.sendEmail(emailOptions)
  		}, 3000);


	} catch (error) {
		console.error('An error occurred:', error);
		utilities.sendErrorEmail(error)
	}
}


// Function to append data to the CSV file
function appendToCSV(data,start,end) {
    // Read existing CSV data
    fs.readFile(csvFilePath, 'utf8', (err, existingData) => {
        if (err) {
            console.error('Error reading CSV file:', err);
            return;
        }

        const csvWriter = createObjectCsvWriter({
            path: csvFilePath,
            header: [
                { id: 'week', title: 'Week' },
                { id: 'totalSales', title: 'Total Sales' },
                { id: 'numOrders', title: 'Num Orders' },
                { id: 'numSubscriberOrders', title: 'Num Subscriber Orders' },
                { id: 'numGuestOrders', title: 'Num Guest Orders' },
                { id: 'averageItemsPerOrder', title: 'Average Itemns Per Order' },
                { id: 'averageOrderAmount', title: 'Average Order Amount' },
                { id: 'totalActiveSubscribers', title: 'Total Active Subscribers' },
                { id: 'projectedMonthlySubscriptionRevenue', title: 'Projected Monthly Subscription Revenue' }
            ]
        });

        let records = [];
        if (existingData) {
            records = existingData.split('\n').map(line => {
                const row = line.split(',');
                return {
                    week: row[0],
                    totalSales: parseFloat(row[1]),
                    numOrders: parseInt(row[2]),
                    numSubscriberOrders: parseInt(row[3]),
                    numGuestOrders: parseInt(row[4]),
                    averageItemsPerOrder: parseFloat(row[5]),
                    averageOrderAmount: parseFloat(row[6]),
                    totalActiveSubscribers: parseInt(row[7]),
                    projectedMonthlySubscriptionRevenue: parseFloat(row[8])
                };
            });
        }

        // Find and update existing data if week exists
        const existingIndex = records.findIndex(record => record.week === data.week);
        if (existingIndex !== -1) {
            records[existingIndex] = data;
        } else {
            records.push(data);
        }

		// Filter out rows with empty week value
		records = records.filter(record => record.week && record.week !== "Week");

        // Sort by week
        records.sort((a, b) => a.week.localeCompare(b.week));

        csvWriter.writeRecords(records)
            .then(() => console.log('Data appended to CSV file'))
            .catch(err => console.error('Error appending data to CSV file:', err));
    });
}

// Define the CSV file path
const csvFilePath = 'data/weekly_kpi.csv';

// Check if the file exists, if not, create it with headers
if (!fs.existsSync(csvFilePath)) {
    const csvWriter = createObjectCsvWriter({
        path: csvFilePath,
        header: [
            { id: 'week', title: 'Week' },
            { id: 'totalSales', title: 'Total Sales' },
            { id: 'numOrders', title: 'Num Orders' },
            { id: 'numSubscriberOrders', title: 'Num Subscriber Orders' },
            { id: 'numGuestOrders', title: 'Num Guest Orders' },
            { id: 'averageItemsPerOrder', title: 'Average Items Per Order' },
            { id: 'averageOrderAmount', title: 'Average Order Amount' },
            { id: 'totalActiveSubscribers', title: 'Total Active Subscribers' },
            { id: 'projectedMonthlySubscriptionRevenue', title: 'Projected Monthly Subscription Revenue' }
        ]
    });

    csvWriter.writeRecords([]); // Create an empty CSV file with headers
}


// Extract command line arguments
const commandLineArgs = process.argv.slice(2); // slice to remove first two default arguments

// Default to today's date if no command line argument provided
const dateArg = commandLineArgs.length > 0 ? commandLineArgs[0] : utilities.getToday();
const priorWeek = utilities.getPreviousWeek(dateArg); // Date is formatted as "YYYY-MM-DD"

//priorWeek = utilities.getPreviousWeek(utilities.getToday())  // Date is formatted as "YYYY-MM-DD"

const salesData = {
	week: priorWeek.start + ' to ' + priorWeek.end,
    totalSales: 0,
    numOrders: 0,
    numSubscriberOrders: 0,
    numGuestOrders: 0,
    averageItemsPerOrder: 0,
	averageOrderAmount: 0,
    totalActiveSubscribers: 0,
    projectedMonthlySubscriptionRevenue: 0
};

//console.log(priorWeek.start)
run(priorWeek.start, priorWeek.end);
