#!/bin/bash
set -m
mongod &
sleep 5
cd ..
cd ..
node index.js
