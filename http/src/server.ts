/// <reference path="typings/tsd.d.ts"/>

require('source-map-support').install();
import fs = require('fs');
import path = require('path');
var log4js = require('log4js');
import server = require('./http/application/server');

var LOG_DIRECTORY = path.dirname(process.argv[1]) + '/../log'
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
        maxLogSize: 40 * MEGA,
        backups: 2
    }]
});

var local = parseIpAddress(process.argv[2]);
var localIp = local.ip || '0.0.0.0';
var localPort = local.port || 8080;

var root = parseIpAddress(process.argv[3])
var rootIp = root.ip || '127.0.0.1';
var rootPort = root.port || 7180;
var dbAddress = process.argv[4] || '127.0.0.1:27017/dp';

server(localIp, localPort, rootIp, rootPort, dbAddress, __dirname + '/public');

function parseIpAddress(arg: string) {
    if (arg == null)
        return { ip: null, port: null };

    var array = arg.split(':');
    if (array.length === 2) {
        return { ip: array[0], port: parseInt(array[1], 10) };
    }
    var port = parseInt(arg, 10);
    if (port != null) {
        return { ip: null, port: port };
    }
    return { ip: arg, port: null };
}
