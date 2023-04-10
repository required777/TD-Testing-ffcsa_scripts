const mysql = require('mysql');
const fs = require("fs");
const config = require('config');

// Fetch configuration parameters
const host = config.get("server.host");
const user = config.get("server.user");
const password = config.get("server.password");
const database = config.get("server.database");

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
    console.log(result);
    return new Promise(resolve => {
       resolve('resolved');
    })

}

// Make async function main to wait for processing to complete before exiting
(async function main() {
    const result = await processFile(__dirname + "/scripts/shop_product.sql");
    console.log(result);
    process.exit();
})()

