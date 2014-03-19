/// <reference path='typings/tsd.d.ts'/>
/// <reference path='typings/log4js.d.ts'/>

import fs = require('fs');
import path = require('path');
import log4js = require('log4js');
import root = require('./rootserver/rootserver');

var pcpPort = parseInt(process.argv[2], 10);
if (isNaN(pcpPort))
    pcpPort = 7144;
var httpPort = parseInt(process.argv[3], 10);
if (isNaN(httpPort))
    httpPort = 7180;

var LOG_DIRECTORY = path.dirname(process.argv[1]) + '/log';
if (!fs.existsSync(LOG_DIRECTORY)) {
    fs.mkdirSync(LOG_DIRECTORY, '777');
}
log4js.configure({
    appenders: [
        {
            category: 'root-pcp',
            type: 'dateFile',
            filename: LOG_DIRECTORY + '/root-pcp.log',
            pattern: '-yyyy-MM-dd'
        },
        {
            category: 'root-http',
            type: 'dateFile',
            filename: LOG_DIRECTORY + '/root-http.log',
            pattern: '-yyyy-MM-dd'
        },
        {
            category: 'root-ws',
            type: 'dateFile',
            filename: LOG_DIRECTORY + '/root-ws.log',
            pattern: '-yyyy-MM-dd'
        }]
});

var rootServer = new root.RootServer(pcpPort, httpPort);
rootServer.listen();
process.on('SIGINT', () => {
    rootServer.close();
    console.log('Got SIGINT. server close.')
});
