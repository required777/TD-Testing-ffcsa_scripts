# Local Line Deferred Order Sample

Simple node.js routine to create a new subscription with a deferred payment.



## Notes:
// After routine is run, need to send a request for payment, eg. like:
e.g. for order 2970432, send a request to pay
https://localline.ca/api/backoffice/v2/orders/2970432/request-payment/

## Questions,
1. After i go through this process, three different emails are sent to the subscriber. this seems like alot. Can i make this just the "order" -- this one actually has a link to pay now which is nice.
   1. an order (the only one i want at this time)
   2. a notice of an upcoming subscription
   3. a notice of a created subscription
2. I'd like to add a $50 Herd Share payment on the very first order only, which would use store credits (after they are applied)... best way to handle this?
3. 