/// <reference path="typings/tsd.d.ts"/>

import fs = require('fs');
import path = require('path');
var log4js = require('log4js');
import server = require('./http/application/server');

var LOG_DIRECTORY = path.dirname(process.argv[1]) + '/log'
try {
    fs.mkdirSync(LOG_DIRECTORY, '777');
} catch (e) {
}
var MEGA = 1048576;
log4js.configure({
    appenders: [{
        category: 'app',
        type: 'file',
        filename: LOG_DIRECTORY + '/http.log',
        maxLogSize: 50 * MEGA,
        backups: 3
    }]
});

var ipaddress = process.env.OPENSHIFT_INTERNAL_IP || process.env.OPENSHIFT_NODEJS_IP || 'localhost';
var port = parseInt(process.argv[2], 10);
if (isNaN(port)) {
    port = process.env.OPENSHIFT_INTERNAL_PORT || process.env.OPENSHIFT_NODEJS_PORT || 80;
}

server(ipaddress, port, __dirname + '/public');