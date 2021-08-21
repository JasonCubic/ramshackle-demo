FROM node:14.17.0-alpine3.13

LABEL name=ramshackle-api
LABEL version=1

WORKDIR /usr/app

COPY package.json package.json
COPY index.js index.js

RUN yarn install --pure-lockfile --production --proxy "${HTTP_PROXY}" --https-proxy "${HTTPS_PROXY}" && yarn cache clean

CMD ["node", "."]
