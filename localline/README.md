Contained in this directory are sceripts that generate PDF reports for FFCSA operations and reporting.

1. `checklists.js` generates checklists used for packing for each fulfillment date
2. `delivery_orders.js` generates delivery orders for each fulfillment date
3. `vendors.js` generates vendor pull lists for each fulfillment date
4. `monthly_vendors.js`  generates sales by vendor for the previous month
5. `subscriptions.js`  generates a list of new payments for subscription and then updates accounts

The above scripts are designed to run using a cronjob (see below).  There may be times when you need to run these scripts
manually.  In this case you want to alter and run node files each individually,
calling the script main or run function with a specific date that you want to run,
for example changing the line `delivery_order(utilities.getNextFullfillmentDate());` with `delivery_order('2023-10-31)`
and then running the script like  `node delivery_order.js` 

The cronjob to use for all scripts is below.  `run.sh` is a bash script that runs
each individual nodejs script.  All of the nodejs scripts generate a different
type of report that is emailed.  `run.sh` outputs a log file into `data/output.log`

NOTE: always run `delivery_orders.js` first since that downloads necessary files for other
scripts

```
# Run Subscriptions every day at 03:01 PT which is 11:00 UTC
1 0 * * * /home/exouser/code/ffcsa_scripts/localline/run.sh subscription.js

# Run all on Monday at 06:00 PT which is 14:00 UTC
0 14 * * 1  /home/exouser/code/ffcsa_scripts/localline/run.sh delivery_orders.js 
0 14 * * 1  /home/exouser/code/ffcsa_scripts/localline/run.sh checklists.js
0 14 * * 1  /home/exouser/code/ffcsa_scripts/localline/run.sh vendors.js

# Run all on Thursday at 06:00 PT which is 14:00 UTC
0 14 * * 4 /home/exouser/code/ffcsa_scripts/localline/run.sh delivery_orders.js
0 14 * * 4 /home/exouser/code/ffcsa_scripts/localline/run.sh checklists.js
0 14 * * 4 /home/exouser/code/ffcsa_scripts/localline/run.sh vendors.js

# Run monthly_vendors report on the 1st of the month at 4:01 PT which is 12:00 UTC
1 12 1 * * /home/exouser/code/ffcsa_scripts/localline/run.sh monthly_vendors.js
```

`run.sh` sets up the node environment using NVM. It is important that we point to both
a current node here and that has the properly installed dependencies...

```
#!/bin/bash
# use NVM to get latest node
export NVM_DIR=$HOME/.nvm;
source $NVM_DIR/nvm.sh;
```
