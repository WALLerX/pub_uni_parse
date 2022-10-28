FROM node:18.9.1-slim as base

WORKDIR /home/node/app

ENV TZ="Asia/Krasnoyarsk"
ENV AD_TOTAL=0
ENV AD_CURRENT=0
ENV PARSE_STATUS="stopped"
ENV START_TIME=""
ENV CURRENT_TIME=""

COPY parser_avito/package*.json ./

RUN npm i

RUN apt-get -y update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get -y update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get -y update
RUN apt-get -y install tesseract-ocr

COPY parser_avito/. .

FROM base as production

ENV NODE_PATH="./build"

RUN npm run build