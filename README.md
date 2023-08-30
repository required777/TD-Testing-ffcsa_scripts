# ffcsa_scripts
publicly available scripts on FFCSA database

Need to install npm packages: mysql, config, fs


```
#To generate an excel spreadsheet 
node query-to-xlsx.sh script/vapg.sql

#run the monthly script files and email 
node runner.sh script/product_export.sql "message"
```

To run one-off exports 
```
node runner-onetime.sh
```

To install, need to create a config directory with default.json specifying connection parameters
Also, for gmail settings be sure to use app password.  see config settings
