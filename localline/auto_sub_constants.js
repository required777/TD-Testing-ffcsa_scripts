// account information
exports.SUBDOMAIN = "full-farm-csa";

// price list information
exports.PRICE_LIST_ID = 2719; // Become A Member Price List

// fulfillment information
exports.FULFILLMENT_STRATEGY_ID = 10122; // ensure pickup, otherwise address req'd
exports.FIRST_FULFILLMENT_DATE = "2024-02-17"; // first day of subscription (must be in future)

// payment information
exports.PAYMENT_STRATEGY_ID = 3625; // Local Pay Method

// customer information
exports.FIRST_NAME = "John";
exports.LAST_NAME = "Deck";
exports.EMAIL = "jdeck88@gmail.com";
exports.PHONE = "5556667777";

// subscription information
exports.FREQUENCY = 30;
exports.FREQUENCY_UNIT = "day";
exports.SUBSCRIPTION_PRODUCT_PACKAGE_ID = 197861; // Harvester - 197861, Grazer - 203528, Forager - 203529, Raw Dairy - 204800
exports.SUBSCRIPTION_QUANTITY = 1; // increase for more shares

// DO NOT CHANGE
const BASE_URL = "https://localline.ca/api/storefront/v2";
exports.ORDER_EXPANDS =
  "expand=order_entries.product,order_entries.package_price_list_entry,price_list,price_list.price_list_order_subscription_settings,payment.gateway_payment_method";
exports.AUTH_URL = `${BASE_URL}/token/anonymous`;
exports.ORDER_URL = `${BASE_URL}/orders`;
exports.LOCAL_PAY_GATEWAY_PAYMENT_METHOD = 3;