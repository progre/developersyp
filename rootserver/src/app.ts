/// <reference path='DefinitelyTyped/log4js.d.ts'/>
/// <reference path='DefinitelyTyped/node_patch.d.ts'/>

import root = require('./rootserver/rootserver');
var pcpPort = parseInt(process.argv[2], 10);
if (isNaN(pcpPort))
    pcpPort = 7144;
var httpPort = parseInt(process.argv[3], 10);
if (isNaN(httpPort))
    httpPort = 7180;

var rootServer = new root.RootServer(pcpPort, httpPort);
rootServer.listen();
process.on('SIGINT', () => {
    rootServer.destroy();
    console.log('Got SIGINT. server destroy.')
});
