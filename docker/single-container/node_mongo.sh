#!/bin/bash
set -m
mongod &
sleep 5
node index.js
