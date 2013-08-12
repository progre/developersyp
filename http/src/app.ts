/// <reference path="DefinitelyTyped/node/node.d.ts"/>
/// <reference path="DefinitelyTyped/express/express.d.ts"/>

import fs = require('fs');
import server = require('application/server');
import path = require('path');
var log4js = require('log4js');

var LOG_DIRECTORY = path.dirname(process.argv[1]) + '/log'
if (!fs.existsSync(LOG_DIRECTORY)) {
    fs.mkdirSync(LOG_DIRECTORY, '777');
}

log4js.configure({
    appenders: [{
        category: 'app',
        type: 'dateFile',
        filename: LOG_DIRECTORY + '/http.log',
        pattern: '-yyyy-MM-dd'
    }]
});

var ipaddress = process.env.OPENSHIFT_INTERNAL_IP || process.env.OPENSHIFT_NODEJS_IP || 'localhost';
var port = parseInt(process.argv[2], 10);
if (isNaN(port)) {
    port = process.env.OPENSHIFT_INTERNAL_PORT || process.env.OPENSHIFT_NODEJS_PORT || 80;
}

server(ipaddress, port, __dirname + '/public', log4js.getLogger('app'));