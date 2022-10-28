FROM node:18.9.1-slim as base

WORKDIR /home/node/app

ENV TZ="Asia/Krasnoyarsk"
ENV AD_TOTAL=0
ENV AD_CURRENT=0
ENV PARSE_STATUS="stopped"
ENV START_TIME=""
ENV CURRENT_TIME=""

COPY web_app/package*.json ./

RUN npm i

COPY web_app/. .

FROM base as production

ENV NODE_PATH="./build"

RUN npm run build