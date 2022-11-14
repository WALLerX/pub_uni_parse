FROM node:18.9.1-slim as base

WORKDIR /home/node/app

ENV TZ="Asia/Krasnoyarsk"

COPY get_data_api/package*.json ./

RUN npm i

COPY get_data_api/. .

FROM base as production

ENV NODE_PATH="./build"

RUN npm run build