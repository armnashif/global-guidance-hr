#!/bin/bash
echo ""
echo " Global Guidance Operations Portal v16z"
echo " ================================"
echo ""
if ! command -v node &> /dev/null; then
  echo " ERROR: Node.js not installed!"
  echo " Download from: https://nodejs.org"
  echo " Then run this script again."
  exit 1
fi
if [ ! -d node_modules ]; then
  echo " Installing dependencies (first run only)..."
  npm ci || exit 1
fi
echo " Starting portal at http://localhost:3000 ..."
npm start
