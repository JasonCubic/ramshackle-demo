#!/bin/bash

# jscpd:ignore-start

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

# jscpd:ignore-end

print_yellow "\nstarting semgrep scan.\n"

# not always necessary to remove the image.  just done because returntocorp/semgrep:latest is updated often.
# docker rmi returntocorp/semgrep:latest

# to mount the semgrep container interactively to look around:
# docker run -it --rm -v "$(pwd):/src" --entrypoint="/bin/sh" returntocorp/semgrep

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
  --config "p/ci" \
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
