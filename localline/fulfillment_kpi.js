const https = require('https');
const fs = require('fs');

const url = 'https://raw.githubusercontent.com/jdeck88/ffcsa_scripts/main/localline/data/fulfillment_kpi.json';
const outputFile = 'data/fulfillment_summary_kpi.json';

// Function to fetch JSON data from URL
function fetchData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

async function generateSalesDataByFulfillmentName() {
    try {
        // Fetch JSON data from URL
        const jsonData = await fetchData(url);

        // Object to store data grouped by fulfillmentName
        const salesByFulfillmentName = {};

        // Iterate through each week's data
        jsonData.weeks.forEach(week => {
            const dateRange = week.dateRange;

            week.data.forEach(entry => {
                const { fulfillmentName, total, count } = entry;
                
                if (!salesByFulfillmentName[fulfillmentName]) {
                    salesByFulfillmentName[fulfillmentName] = [];
                }

                salesByFulfillmentName[fulfillmentName].push({
                    dateRange: dateRange,
                    total: total,
                    count: count
                });
            });
        });

        // Prepare the final structured data object
        const structuredData = {};

        // Iterate through salesByFulfillmentName to format the output
        Object.keys(salesByFulfillmentName).forEach(fulfillmentName => {
            structuredData[fulfillmentName] = salesByFulfillmentName[fulfillmentName].map(data => ({
                dateRange: data.dateRange,
                total: data.total,
                count: data.count
            })).sort((a, b) => new Date(a.dateRange.split(' to ')[0]) - new Date(b.dateRange.split(' to ')[0]));
        });

        // Convert structuredData to JSON string
        const jsonDataString = JSON.stringify(structuredData, null, 2);

        // Write JSON data to file
        fs.writeFileSync(outputFile, jsonDataString);

        console.log(`JSON data has been written to ${outputFile}`);

    } catch (error) {
        console.error('Error fetching or processing data:', error.message);
    }
}

// Call the function to generate and write sales data by fulfillmentName to a file
generateSalesDataByFulfillmentName();

