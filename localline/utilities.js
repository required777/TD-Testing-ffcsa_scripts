var request = require('request');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const nodemailer = require("nodemailer");



// Utilitiy functions for date formatting
function formatDate(inputDate) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Parse the input date string (e.g., "28-Oct-23" or coming in with spaces "28 Oct 23")
    const parts = inputDate.split(/[-\s]+/);
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

// This is our login
function getAccessToken() {
    return new Promise((resolve, reject) => {

        var options = {
            'method': 'POST',
            'url': 'https://localline.ca/api/backoffice/v2/token',
            'headers': {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "username": process.env.USERNAME,
                "password": process.env.PASSWORD
            })

        };

        request(options, (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                resolve(body);
            }
        });
    });
}

// obtain "id" value and save
function getRequestID(urlRequest, accessToken) {
    return new Promise((resolve, reject) => {

        // submit download request -- supply returned "access" 
        var options = {
            'method': 'GET',
            'url': `${urlRequest}`,
            'headers': {
                'Authorization': `Bearer ${accessToken}`
            }
        };

        request(options, (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                resolve(body);
            }
        });
    });
}

function checkRequestId(id, accessToken) {
    return new Promise((resolve, reject) => {

        var options = {
            'method': 'GET',
            'url': `https://localline.ca/api/backoffice/v2/export/${id}/`,
            'headers': {
                'Authorization': `Bearer ${accessToken}`
            }
        };
        request(options, (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                resolve(body);
            }
        });

    });
}

async function pollStatus(id, accessToken) {
    let status = null;
    let pollingStartTime = Date.now();

    const pollInterval = 5000; // 5 seconds
    const maxPollingTime = 60000; // 1 minutes

    while (status !== "COMPLETE") {
        const data = await checkRequestId(id, accessToken);
        status = JSON.parse(data).status;
        console.log(status);

        if (status === "COMPLETE") {
            return JSON.parse(data).file_path
            //return status; // Return the status if it's "COMPLETE"
        }

        if (Date.now() - pollingStartTime >= maxPollingTime) {
            console.error("Status not COMPLETE after 1 minute. Stopping polling.");
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    return ""; // Return an empty string
}

async function downloadData(file_path, filename) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            url: `${file_path}`,
        };

        const downloadDirectory = 'data'; // Define the subdirectory
        let filePath = '';

        request(options, (error, response, body) => {
            if (error) {
                console.error('Error downloading the file:', error);
                reject(error);
            } else {
                // Create the 'data' directory if it doesn't exist
                if (!fs.existsSync(downloadDirectory)) {
                    fs.mkdirSync(downloadDirectory);
                }

                // Extract the filename from the URL
                const urlParts = options.url.split('/');
                //const filename = urlParts[urlParts.length - 1];

                // Determine the file path for the downloaded CSV file
                filePath = path.join(downloadDirectory, filename);

                // Save the CSV content to the specified file
                fs.writeFileSync(filePath, body);
                console.log(`File saved at ${filePath}`);
                resolve(filePath);
            }
        });
    });
}

async function downloadBinaryData(url, fileName, accessToken) {
    try {
        const headers = {
            'Authorization': `Bearer ${accessToken}`
        };
        const response = await axios.get(url, { responseType: 'arraybuffer', headers });

        // Write the binary data to a file
        fs.writeFileSync(fileName, response.data);

        return fileName; // Return the path to the downloaded file
    } catch (error) {
        throw error;
    }
}

async function sendEmail(filepath, filename, subject) {
    console.log('function here to email the file ' + filepath)
    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
        service: "Gmail", // e.g., "Gmail" or use your SMTP settings
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_ACCESS ,
        },
    });

    // Email information
    const emailOptions = {
        from: "jdeck88@gmail.com",
        to: "jdeck88@gmail.com",
        subject: subject,
        text: "Please see the attached file.  Reports are generated twice per week in advance of fullfillment dates.",
    };

    // File to attach
    const filePath = filepath;

    // Read the file as a buffer
    const fileBuffer = fs.readFileSync(filepath);

    // Attach the file to the email
    emailOptions.attachments = [
        {
            filename: filename, // Change the filename as needed
            content: fileBuffer, // Attach the file buffer
        },
    ];

    // Send the email with the attachment
    transporter.sendMail(emailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
        } else {
            console.log("Email sent:", info.response);
        }
    });
}

function getNextTuesdayOrSaturday() {
    const today = new Date();
  
    // Calculate the days until the next Tuesday and Saturday.
    const daysUntilNextTuesday = (2 - today.getDay() + 7) % 7;
    const daysUntilNextSaturday = (6 - today.getDay() + 7) % 7;
  
    // Calculate the date for the next Tuesday and Saturday.
    const nextTuesday = new Date(today);
    nextTuesday.setDate(today.getDate() + daysUntilNextTuesday);
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + daysUntilNextSaturday);
  
    // Determine which is closer to the current date.
    return nextTuesday < nextSaturday ? nextTuesday : nextSaturday;
  }
  
  function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  function getNextFullfillmentDate() {
    const nextTuesdayOrSaturday = getNextTuesdayOrSaturday();
    const formattedDate = formatDateToYYYYMMDD(nextTuesdayOrSaturday);
    return formattedDate;
  }
  
module.exports = {
    formatDate,
    getAccessToken,
    getRequestID,
    checkRequestId,
    pollStatus,
    downloadData,
    downloadBinaryData,
    sendEmail,
    getNextFullfillmentDate
};