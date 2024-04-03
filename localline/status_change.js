const fs = require('fs');
require('dotenv').config();
const utilities = require('./utilities');

function findStatusChanges(oldFilePath, newFilePath) {
	// Read old subscribers file
	const oldData = fs.readFileSync(oldFilePath, 'utf8');
	const oldLines = oldData.trim().split('\n');
	const oldHeader = oldLines[0].split(',');

	// Find the index of 'status', 'email', and 'Plan #' columns in the old file
	const oldStatusIndex = oldHeader.findIndex(column => column.toLowerCase() === 'status');
	const oldEmailIndex = oldHeader.findIndex(column => column.toLowerCase() === 'email');
	const oldPlanIndex = oldHeader.findIndex(column => column.toLowerCase() === 'plan #');
	const oldCustomerIndex = oldHeader.findIndex(column => column.toLowerCase() === 'customer');

	// Read new subscribers file
	const newData = fs.readFileSync(newFilePath, 'utf8');
	const newLines = newData.trim().split('\n');
	const newHeader = newLines[0].split(',');

	// Find the index of 'status', 'email', and 'Plan #' columns in the new file
	const newStatusIndex = newHeader.findIndex(column => column.toLowerCase() === 'status');
	const newEmailIndex = newHeader.findIndex(column => column.toLowerCase() === 'email');
	const newPlanIndex = newHeader.findIndex(column => column.toLowerCase() === 'plan #');
	const newCustomerIndex = newHeader.findIndex(column => column.toLowerCase() === 'customer');

	// Find status changes
	const cancelledCustomers = [];
	const newCustomers = [];
	const newPlans = [];

	for (let i = 1; i < oldLines.length; i++) {
		const oldColumns = oldLines[i].split(',');
		const oldEmail = oldColumns[oldEmailIndex];
		const oldStatus = oldColumns[oldStatusIndex];
		const oldPlan = oldColumns[oldPlanIndex];
		const oldCustomer = oldColumns[oldCustomerIndex];

		const newLine = newLines.find(line => {
			const newColumns = line.split(',');
			const newEmail = newColumns[newEmailIndex];
			const newStatus = newColumns[newStatusIndex];
			const newPlan = newColumns[newPlanIndex];
			const newCustomer = newColumns[newCustomerIndex];
			return newEmail === oldEmail && newStatus !== oldStatus && newPlan === oldPlan;
		});

		if (newLine) {
			const newColumns = newLine.split(',');
			const newEmail = newColumns[newEmailIndex];
			const newStatus = newColumns[newStatusIndex];
			const newCustomer = newColumns[newCustomerIndex];
			if (newStatus.toLowerCase() === 'cancelled') {
				cancelledCustomers.push({ email: newEmail, plan: oldPlan, customer: newCustomer });
			} else if (newStatus.toLowerCase() === 'active') {
				newCustomers.push({ email: newEmail, plan: oldPlan, customer: newCustomer });
			}
		}
	}

	// Check for new plans
	for (let i = 1; i < newLines.length; i++) {
		const newColumns = newLines[i].split(',');
		const newEmail = newColumns[newEmailIndex];
		const newPlan = newColumns[newPlanIndex];
		const newCustomer = newColumns[newCustomerIndex];

		const isNewPlan = !oldLines.some(oldLine => {
			const oldColumns = oldLine.split(',');
			const oldEmail = oldColumns[oldEmailIndex];
			const oldPlan = oldColumns[oldPlanIndex];
			return oldEmail === newEmail && oldPlan === newPlan;
		});

		if (isNewPlan) {
			newPlans.push({ email: newEmail, plan: newPlan, customer: newCustomer });
		}
	}

	return { cancelledCustomers, newPlans };
}

//const priorWeek = utilities.getPreviousWeek('2024-03-25'); // Date is formatted as "YYYY-MM-DD"
const priorWeek = utilities.getPreviousWeek(utilities.getToday()); // Date is formatted as "YYYY-MM-DD"
const { cancelledCustomers, newPlans } = findStatusChanges('data/subscribers_'+priorWeek.sundaystart+'.csv', 'data/subscribers_'+priorWeek.end+'.csv');

setTimeout(() => {
	subjectString =  'FFCSA Reports: New and Cancelled Plans ' + priorWeek.start + " to " + priorWeek.end;

	const cancelledCustomersText = cancelledCustomers.map(customer => `Email: ${customer.email}, Plan: ${customer.plan}, Customer: ${customer.customer}`).join('\n');
	const newPlansText = newPlans.map(plan => `Email: ${plan.email}, Plan: ${plan.plan}, Customer: ${plan.customer}`).join('\n');

	const textString = `
New plans:
	${newPlansText}

Cancelled plans:
	${cancelledCustomersText}
`;

	const emailOptions = {
		from: "jdeck88@gmail.com",
		to: "fullfarmcsa@deckfamilyfarm.com",
		cc: "jdeck88@gmail.com",
		subject: subjectString,
		text: textString
	};
	utilities.sendEmail(emailOptions)
}, 1000);

