#!/bin/bash

# jscpd:ignore-start

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

# jscpd:ignore-end
