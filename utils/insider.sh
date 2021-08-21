#!/bin/bash

# rm -rf ./sqlmap

# # https://github.com/sqlmapproject/sqlmap

# docker run --rm -it -v "/$(pwd)/sqlmap:/home/sqlmap/.sqlmap:rw" ilyaglow/sqlmap \
# --dump \
# --url http://host.docker.internal:8080/get-a-user-by-id?id=1


# # https://github.com/ShiftLeftSecurity/sast-scan
# # https://slscan.io/en/latest/
# docker run --rm -e "WORKSPACE=$(pwd)" \
#   -v "/src/node_modules" \
#   -v "/src/report" \
#   -v "/src/sqlmap" \
#   -v "$(pwd):/app" \
#   shiftleft/sast-scan scan --build

# pwd

docker run --rm -v "/target-project/node_modules" \
  -v "/target-project/report" \
  -v "/target-project/reports" \
  -v "/target-project/sqlmap" \
  -v "$(pwd):/target-project" insidersec/insider -tech javascript -target /target-project

