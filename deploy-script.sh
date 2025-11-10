#!/bin/bash
cd /var/www/coinshares
echo "Starting build at $(date)" > deployment.log
npm run build >> deployment.log 2>&1
if [ $? -eq 0 ]; then
    echo "Build successful, restarting PM2..." >> deployment.log
    pm2 restart coinshares >> deployment.log 2>&1
    echo "Deployment completed at $(date)" >> deployment.log
else
    echo "Build failed at $(date)" >> deployment.log
    exit 1
fi
