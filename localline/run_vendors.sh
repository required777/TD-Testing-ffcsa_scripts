#!/bin/bash
# use NVM to get latest node
export NVM_DIR=$HOME/.nvm;
source $NVM_DIR/nvm.sh;
# change to current location
cd "$(dirname "$0")"
node ./run_vendors.js
