FROM debian:buster-slim

ENV TZ="Asia/Krasnoyarsk"
ENV CRON_AVITO="0 8 * * 6"
ENV CRON_CIAN="0 18 * * 6"
ENV CRON_SIBDOM="0 4 * * 7"
ENV CRON_DOMCLICK="0 14 * * 7"

RUN apt-get update -y && \
    apt-get install cron curl -y

COPY scheduler/cron.sh .
RUN chmod 0777 cron.sh