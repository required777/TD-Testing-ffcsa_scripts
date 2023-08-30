const mysql = require('mysql');
const fs = require("fs");
const config = require('config');
var nodemailer = require('nodemailer');

// Fetch configuration parameters
const host = config.get("server.host");
const user = config.get("server.user");
const password = config.get("server.password");
const database = config.get("server.database");

const gmailuser = config.get("gmail.user");
const gmailpassword = config.get("gmail.password");

// Create connection
const con = mysql.createConnection({
   host : host,
   user : user,
   password : password,
   database : database
});

// Run SQL query and return response as a simple table
function runQuery(sql) {
    var response = '';
    return new Promise(resolve => {
        con.query(sql, (err,rows) => {
	    if(err) throw err;
	    var objToJson = rows;
    	    for (var key in rows) {
		for (var val in rows[key]) {
			response += rows[key][val] + "\t";
		}
		response += "\n";
    	    }
            resolve(response);
        });
   });
}

// Read input File to get SQL
async function processFile(inputFile) {
    const buffer = fs.readFileSync(inputFile);
    const sql = buffer.toString();
    console.log('running ' + inputFile)
    result = await runQuery(sql);

    return new Promise(resolve => {
       resolve(result);
    })

}

async function mailerSend(mailOptions,transporter){
    return new Promise((resolve,reject)=>{

    //let transporter = nodemailer.createTransport(transporter);

 transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.log("error is "+error);
       resolve(false); // or use rejcet(false) but then you will have to handle errors
    }
   else {
       console.log('Email sent: ' + info.response);
       resolve(true);
    }
   });
})
}

async function mailer(result,subject) {
    var mailOptions = {
        from: gmailuser,
        to: "fullfarmcsa@deckfamilyfarm.com",
        cc: gmailuser,
        subject: subject,
        text: result
    };

    var transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
           user: gmailuser,
           pass: gmailpassword
        }
   });

   const response = await mailerSend(mailOptions,transporter);
   return new Promise(resolve => { resolve('email sent'); })
}



// Make async function main to wait for processing to complete before exiting
(async function main() {
    if (process.argv.length <= 2) {
      console.error('Expected at least one argument! node process.sh scripts/filename.sql "subject"');
      process.exit(1);
    }

    const sqlResult = await processFile(__dirname + "/" + process.argv[2]);
    console.log(sqlResult);

    //emailResult = await mailer(result, process.argv[3]);

    process.exit();
})()

