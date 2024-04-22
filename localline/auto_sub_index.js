const constants = require("./auto_sub_constants");
const request = require("./auto_sub_request");
require('dotenv').config();
const utilities = require("./utilities")

const express = require('express');
const cors = require('cors');
const app = express();
// Parse JSON bodies
app.use(express.json());
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
const port = 3400;

// Middleware to parse JSON bodies
app.use(cors({origin: '*'}), async function(req, res, body) {
        res.setHeader('Access-Control-Allow-Origin', '*');	

	 if (req.url != '/favicon.ico') {
                console.log('req.method: ' + req.method);
                //console.log('req.url: ' + req.url);

                // Request method handling: exit if not GET or POST
                if ( ! (req.method == 'GET' || req.method == 'POST') ) {
			 errMethod = { error: req.method + " request method is not supported. Use GET or POST." };
                        console.log("ERROR: " + req.method + " request method is not supported.");
                        res.write(JSON.stringify(errMethod));
                        res.end();
                        return;			
		}
 		console.log(req.body)
  		const { email, first_name, last_name, phone, subscription_plan} = req.body;
		if (!email || !first_name || !last_name || !phone || !subscription_plan) {
    			return res.status(400).json({ error: "Missing required parameters. Please provide all parameters." });
  		}
  constants.EMAIL = email;
  constants.FIRST_NAME = first_name;
  constants.LAST_NAME = last_name;
  constants.PHONE = phone;
		 
  // set first fullfillment date to tomorrow
  constants.FIRST_FULFILLMENT_DATE = utilities.getTomorrow(); // must be in future
  
  if (subscription_plan.startsWith("Forager")) {
    constants.SUBSCRIPTION_PRODUCT_PACKAGE_ID = 203529; // Forager
  } else if (subscription_plan.startsWith("Harvester")) {
    constants.SUBSCRIPTION_PRODUCT_PACKAGE_ID = 197861; // Harvester
  } else if (subscription.plan.startsWith("Grazer")) {
    constants.SUBSCRIPTION_PRODUCT_PACKAGE_ID = 203528; // Grazer
  } else {
    // Handle the case if the package name is not recognized
    return res.status(400).json({ error: "Unknown package" });
  }
  const authenticationHeader = await getFrontOfficeAuthentication();
  //data = await utilities.getAccessToken();
  ////accessToken = JSON.parse(data).access;
  //const authenticationHeader = `Bearer ${accessToken}`

  // Create a subscription order
  const order = await createOrder(authenticationHeader);
  await openOrder(order.id, authenticationHeader);

  // Return the order or handle error as needed
  res.json(order);

	 }
})

// Need front office authentication
async function getFrontOfficeAuthentication() {
  const response = await request.post(
    constants.AUTH_URL,
    {},
    { subdomain: constants.SUBDOMAIN },
  );
  const access = JSON.parse(response)["access"];
  return `Bearer ${access}`;
}

async function createOrder(authenticationHeader) {
  let orderJSON =  {
    price_list: constants.PRICE_LIST_ID,
    fulfillment: {
      fulfillment_strategy: constants.FULFILLMENT_STRATEGY_ID,
      fulfillment_date: constants.FIRST_FULFILLMENT_DATE,
    },
    payment: {
      payment_strategy: constants.PAYMENT_STRATEGY_ID,
      gateway_payment_method: constants.LOCAL_PAY_GATEWAY_PAYMENT_METHOD,
      order_payment_strategy: { fees: [] },
      pay_later: true, // THIS IS THE DEFERRED PAYMENT PIECE
    },
    customer_info: {
      email: constants.EMAIL,
      first_name: constants.FIRST_NAME,
      last_name: constants.LAST_NAME,
      phone: constants.PHONE,
    },
    customer_note: "",
    order_entries: [
      {
        package_price_list_entry: constants.SUBSCRIPTION_PRODUCT_PACKAGE_ID,
        storefront_unit_quantity: constants.SUBSCRIPTION_QUANTITY,
        is_subscription: true,
      },
    ],
    subscription_plan: {
      frequency_value: constants.FREQUENCY,
      frequency_unit: constants.FREQUENCY_UNIT,
    },
  }

console.log("Request:", {
    url: constants.ORDER_URL,
    method: 'POST',
    headers: {
        Authorization: authenticationHeader,
        // Add any other headers here if necessary
    },
    body: orderJSON // Assuming orderJSON is your request body
});

    const response = await request.post(
        constants.ORDER_URL, orderJSON, { Authorization: authenticationHeader }
    );
	console.log("here is the response:")
	console.log(response);

  return JSON.parse(response);
  //return ''
}

async function openOrder(orderId, authenticationHeader) {
  return await request.post(
    `${constants.ORDER_URL}/${orderId}/open`,
    {},
    { Authorization: authenticationHeader },
  );
}

async function main() {
  const authenticationHeader = await getAuthentication();
  const order = await createOrder(authenticationHeader);
  //await openOrder(order.id, authenticationHeader);
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
