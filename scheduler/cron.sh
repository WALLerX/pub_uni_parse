#!/bin/bash
echo "SHELL=/bin/bash" > /etc/cron.d/reguest-cron
echo "${CRON_AVITO} root curl -X GET -H \"Content-Type: application/json\" \"http://parser_avito:8080/api?action=start_parse\" >> /var/log/cron.log 2>&1" >> /etc/cron.d/reguest-cron
echo "${CRON_CIAN} root curl -X GET -H \"Content-Type: application/json\" \"http://parser_cian:8080/api?action=start_parse\" >> /var/log/cron.log 2>&1" >> /etc/cron.d/reguest-cron
echo "${CRON_SIBDOM} root curl -X GET -H \"Content-Type: application/json\" \"http://parser_sibdom:8080/api?action=start_parse\" >> /var/log/cron.log 2>&1" >> /etc/cron.d/reguest-cron
echo "${CRON_DOMCLICK} root curl -X GET -H \"Content-Type: application/json\" \"http://parser_domclick:8080/api?action=start_parse\" >> /var/log/cron.log 2>&1" >> /etc/cron.d/reguest-cron
echo "
";

crontab /etc/cron.d/reguest-cron
chmod 0644 /etc/cron.d/reguest-cron
touch /var/log/cron.log

/etc/init.d/cron start
tail -f /dev/null