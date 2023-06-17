# ffcsa_scripts
publicly available scripts on FFCSA database

Need to install npm packages: mysql, config, fs


To run the monthly script files, run like:
```
node runner.sh
```

To run one-off exports 
```
node runner-onetime.sh
```

To install, need to create a config directory with default.json specifying connection parameters
Also, for gmail settings be sure to use app password.  see config settings
