#!/bin/bash
echo ""
echo " Global Guidance HR System v4.0"
echo " ================================"
echo ""
if ! command -v node &> /dev/null; then
  echo " ERROR: Node.js not installed!"
  echo " Download from: https://nodejs.org"
  echo " Then run this script again."
  exit 1
fi
echo " Starting server..."
node server.js
