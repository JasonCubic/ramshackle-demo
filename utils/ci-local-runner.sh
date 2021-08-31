#!/bin/bash

if [ ! -f .env ]; then
  echo "ERROR: .env file does not exist.  Exiting script."
  echo "You can rename the file .env.default to .env to resolve this error."
  exit 1
fi

set -a
# shellcheck source=.env
# shellcheck disable=SC1091
source <(sed <.env -e 's/[^[:print:]\t]//g')
set +a

RED="\033[31m"
YELLOW="\033[33m"
GREEN="\033[32m"
RESET="\033[0m"

print_yellow() {
  echo -e "${YELLOW}${1}${RESET}"
}

print_red() {
  echo -e "${RED}${1}${RESET}"
}

print_green() {
  echo -e "${GREEN}${1}${RESET}"
}

# delete any ci reports from previous runs
print_yellow "removing old ci reports."
rm -rf ./report
rm -rf ./reports
rm -rf ./sqlmap
rm ./semgrep-results.sarif

# to mount the mega-linter container interactively to look around:
# docker run -it --rm -v "/$(pwd):/tmp/lint" --entrypoint="/bin/sh" nvuillam/mega-linter:v4

print_yellow "\nstarting mega-linter lint.\n"
docker run -it --rm \
  -v "/var/run/docker.sock:/var/run/docker.sock" \
  -v "/src/node_modules" \
  -v "/src/report" \
  -v "/src/reports" \
  -v "/src/sqlmap" \
  -v "/$(pwd):/tmp/lint" \
  -e "HTTP_PROXY=$HTTP_PROXY" \
  -e "HTTPS_PROXY=$HTTPS_PROXY" \
  nvuillam/mega-linter-javascript:v4
if [ $? -eq 0 ]; then
  print_green "\nlocal ci mega-linter succeeded.\n"
else
  print_red "\nlocal ci mega-linter failed, check the logs in the /report folder and resolve the linting issues"
  print_red "exiting without running semgrep sast.\n"
  exit 1
fi

# to mount the semgrep container interactively to look around:
# docker run -it --rm -v "$(pwd):/src" --entrypoint="/bin/sh" returntocorp/semgrep

print_yellow "\nstarting semgrep scan.\n"

docker rmi returntocorp/semgrep:latest

docker run -it --rm \
  -v "/src/node_modules" \
  -v "/src/report" \
  -v "/src/reports" \
  -v "/src/sqlmap" \
  -v "/src/utils" \
  -v "/$(pwd):/src" \
  -e "HTTP_PROXY=$HTTP_PROXY" \
  -e "HTTPS_PROXY=$HTTPS_PROXY" \
  returntocorp/semgrep:latest \
  --config "p/owasp-top-ten" \
  --config "p/command-injection" \
  --config "p/insecure-transport" \
  --config "p/security-audit" \
  --config "p/r2c-best-practices" \
  --config "p/jwt" \
  --config "p/xss" \
  --config "p/javascript" \
  --config "p/security-audit" \
  --config "p/eslint-plugin-security" \
  --config "p/r2c-best-practices" \
  --config "p/expressjs" \
  --config "p/r2c" \
  --config "p/ci" \
  --config "p/secrets" \
  --config "p/nodejs" \
  --config "p/nodejsscan" \
  --config "p/docker" \
  --config "p/dockerfile" \
  --config "p/docker-compose" \
  --config "p/sql-injection" \
  --config "r/javascript.lang.security.audit.sqli.node-mssql-sqli.node-mssql-sqli" \
  --sarif \
  --output "/src/semgrep-results.sarif" \
  --error
if [ $? -eq 0 ]; then
  print_green "\nlocal ci semgrep sast succeeded.\n"
else
  print_red "\nlocal ci semgrep sast failed.\ncheck the sarif file: /semgrep-results.sarif\n"
  exit 1
fi

# if you want to use the same container that github actions uses for semgrep, this is the one: returntocorp/semgrep-action
# but it does not output a sarif report file the same way
