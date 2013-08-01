/// <reference path='DefinitelyTyped/log4js.d.ts'/>
/// <reference path='DefinitelyTyped/node_patch.d.ts'/>

import root = require('./rootserver/rootserver');
var pcpPort = parseInt(process.argv[2], 10);
if (pcpPort == null)
    pcpPort = 7144;
var httpPort = parseInt(process.argv[3], 10);
if (httpPort == null)
    httpPort = 7146;

new root.RootServer(pcpPort, httpPort).listen();
