#!/bin/bash
# use NVM to get latest node
export NVM_DIR=$HOME/.nvm;
source $NVM_DIR/nvm.sh;
# change to current location
cd "$(dirname "$0")"
node ./run_delivery_order.js
node ./run_checklist.js
node ./run_vendors.js

