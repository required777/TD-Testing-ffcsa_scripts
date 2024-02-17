const constants = require("./auto_sub_constants");
const request = require("./auto_sub_request");
require('dotenv').config();
const utilities = require("./utilities")
const express = require('express');

const app = express();
const port = 3400;

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to handle creating orders
app.post('/create-order', async (req, res) => {
  const { email, first_name } = req.body;

  // Set constants.EMAIL and constants.FIRST_NAME based on request body
  constants.EMAIL = email;
  constants.FIRST_NAME = first_name;

  const authenticationHeader = await getAuthentication();
  // Create a subscription order
  const order = await createOrder(authenticationHeader);
  //await openOrder(order.id, authenticationHeader);

  // Return the order or handle error as needed
  res.json(order);
});


async function getAuthentication() {
    data = await utilities.getAccessToken();
    const accessToken = JSON.parse(data).access;
    return `Bearer ${accessToken}`
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
  console.log(orderJSON)
    //const response = await request.post(
    //    constants.ORDER_URL, orderJSON, { Authorization: authenticationHeader }
    //);
  //return JSON.parse(response);
  return ''
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