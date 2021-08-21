#!/bin/bash

# # https://github.com/ShiftLeftSecurity/sast-scan
# # https://slscan.io/en/latest/
docker run --rm -e "WORKSPACE=$(pwd)" \
  -v "/src/node_modules" \
  -v "/src/report" \
  -v "/src/sqlmap" \
  -v "$(pwd):/app" \
  shiftleft/sast-scan scan --build
