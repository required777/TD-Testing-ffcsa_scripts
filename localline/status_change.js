const fs = require('fs');

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

// Usage example
// A quick example to track old and new subscribers, involves downloading changes...
const oldFile = 'old_subscribers.csv';
const newFile = 'subscribers.csv';

const { cancelledCustomers, newPlans } = findStatusChanges('old_subscribers.csv', 'subscribers.csv');
console.log('cancelled',cancelledCustomers);
console.log('new',newPlans);

