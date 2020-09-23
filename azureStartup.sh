#!/bin/bash

clear
cd /home/site/wwwroot 

if [ ! -d node_modules ]; then
  npm install

fi

if [ ! -d ssl ]; then

  echo "Creating SSL certs for localhost."
  mkdir -p ssl

    if [ ! -f ssl/localhost.txt ]; then
        openssl genrsa -out ssl/localhost.key 2048

        openssl req -new -x509 -key ssl/localhost.key -out ssl/localhost.cert -days 3650 -subj /CN=localhost
    fi

fi

echo "Checking if PM2 process exists"
pm2 describe samlclient > /dev/null
RUNNING=$?

if [ "${RUNNING}" -ne 0 ]; then
  echo "Starting PM2 process"
  pm2 start /home/site/wwwroot/process.json
fi
else
  echo "PM2 process exists"
fi;


