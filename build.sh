#!/bin/bash
cd client
npm install
npm run build
cd ..
mkdir -p dist
cp -r client/dist/* dist/
