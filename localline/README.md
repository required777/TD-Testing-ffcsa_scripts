Set of functions to generate PDF reports for FFCSA packout and deliveries

1. run_checklist.js generates checklists used for packing
2. run_delivery_order.js generates delivery orders.  These papers go with all customer orders

The above scripts are designed to run on a cronjob the Monday and Thursday before the 
fullfillment dates of Tuesday and Saturday.  There may be times when you need to run these scripts
manually.  In this case you want to alter the `run_delivery_order.js` andd `run_checklist.js` scripts
replacing the line `delivery_order(utilities.getNextFullfillmentDate());` with `delivery_order('2023-10-31)`
in both files and then running the runner file `./run.sh`


Setup cronjobs in crontab like:
```
# Local Line Scripts
# Run all on Monday at 6:00 AM
0 6 * * 1 /home/exouser/code/ffcsa_scripts/localline/run.sh > /home/exouser/code/ffcsa_scripts/localline/data/output.log 2>&1
# Run all on Thursday at 6:00 AM
0 6 * * 4 /home/exouser/code/ffcsa_scripts/localline/run.sh > /home/exouser/code/ffcsa_scripts/localline/data/output.log 2>&1
# Run Subscriptions every day at 12:01am
1 0 * * * /home/exouser/code/ffcsa_scripts/localline/run_subscriber.sh > /home/exouser/code/ffcsa_scripts/localline/data/output_subscriber.log 2>&1
```

Use nvm to manage Node.  This involves us setting NVM in shell scripts.  This is important as cronjob does not 
recognize shell installed nvm commands.  We set this in the run shell scripts like:
```
#!/bin/bash
# use NVM to get latest node
export NVM_DIR=$HOME/.nvm;
source $NVM_DIR/nvm.sh;
# change to current location
cd "$(dirname "$0")"
node ./run_subscription.js
```
