#!/bin/bash

clear
cd /home/site/wwwroot 

if [ ! -d node_modules ]; then
  npm install
else
  echo "Node modules directory already exists"
fi

if [ ! -d ssl ]; then

  echo "Creating SSL certs for localhost."
  mkdir -p ssl

    if [ ! -f ssl/localhost.txt ]; then
        openssl genrsa -out ssl/localhost.key 2048
        openssl req -new -x509 -key ssl/localhost.key -out ssl/localhost.cert -days 3650 -subj /CN=localhost
    fi
else
  echo "ssl directory already exists"
fi

echo "Checking if PM2 process exists"
pm2 describe samlclient > /dev/null
RUNNING=$?

if [ "${RUNNING}" -ne 0 ]; then
  echo "Starting PM2 process"
  pm2 start /home/site/wwwroot/process.json
else
  echo "PM2 process exists"
fi

pm2 logs