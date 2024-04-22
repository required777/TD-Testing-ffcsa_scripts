# Automatic Subscription Service

This is a simple node.js routine to create a new subscription and order with a deferred payment.   
We have setup a reverse proxy service that resolves requests coming from the Wix Order System.  The following code
runs in Wix (see developer mode):

```
import wixWindowFrontend from 'wix-window-frontend';


$w.onReady(function () {
    $w("#section1form1").onWixFormSubmit((event) => {        
        // Get form data
        const formData = {};       

        // Define an array of field names you want to select
        const selectedFieldNames = ['Last Name', 'First Name', 'Email', 'Phone', 'Subscription Plan']; // Add more field names as needed

        // Iterate through the fields in event.fields
        event.fields.forEach(field => {
           if (selectedFieldNames.includes(field.fieldName)) {
                // If the field is included, set its value in formData
                formData[field.fieldName.toLowerCase().replace(/\s+/g, '_')] = field.fieldValue;
            }
        });
        console.log(formData)

        // Make a POST request to the third-party service
        fetch('https://THIRDPARTY_HOST_SERVER/SERVICE_ENDPOINT', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })
        .then(response => {
            if (response.ok) {
                // Handle successful response
                console.log('Form data sent successfully');
                // Optionally, show a success message to the user
            } else {
                // Handle error response
                console.error('Error sending form data:', response.statusText);
                // Optionally, show an error message to the user
            }
        })
        .catch(error => {
            // Handle network errors
            console.error('Error sending form data:', error);
            // Optionally, show an error message to the user
        });
    });
});
```

The endpoint receives the request and then turns around and calls 


## Notes:
// After the above routine is run , we can send a request to pay....
//e.g. for order 2970432, send a request to pay
// The following may are may not be necessary as the user may already be getting a payment request link...
https://localline.ca/api/backoffice/v2/orders/2970432/request-payment/

## Questions:
1. After i go through this process, three different emails are sent to the subscriber. this seems like alot. Can i make this just the "order" -- this one actually has a link to pay now which is nice.
   1. an order (the only one i want at this time)
   2. a notice of an upcoming subscription
   3. a notice of a created subscription
2. I'd like to add a $50 Herd Share payment on the very first order only, which would use store credits (after they are applied)... best way to handle this?
