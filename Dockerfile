FROM node:14.17.6-alpine3.14

LABEL name=ramshackle-api
LABEL version=1

WORKDIR /usr/app

COPY package.json package.json
COPY index.js index.js

RUN yarn install --pure-lockfile --proxy "${HTTP_PROXY}" --https-proxy "${HTTPS_PROXY}" && yarn cache clean

CMD ["yarn", "run", "nodemon:dev"]
