import http = require('http');
import path = require('path');
import express = require('express');
import io = require('socket.io');
var log4js = require('log4js');
import routes = require('./routes/index');
import ch = require('./../domain/entity/channel');
import rootserver = require('./../infrastructure/rootserver');
import db = require('./../infrastructure/database');

export = execute;
function execute(ipaddress: string, port: number, rootIp:string, rootPort: number, dbAddress:string, publicPath: string) {
    var logger = log4js.getLogger('app');
    var app = express();

    routes.rootServerIndexRepository = new rootserver.RootServerIndexRepository(rootIp, rootPort);
    db.address = dbAddress;

    app.configure(() => {
        app.use((req, res, next) => {
            logger.info([
                req.headers['x-forwarded-for'] || req.client.remoteAddress,
                new Date().toLocaleString(),
                req.method,
                req.url,
                res.statusCode,
                req.headers.referer || '-',
                req.headers['user-agent'] || '-'
            ].join('\t'));
            next();
        });
        app.use(express.favicon());
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(app.router);
        app.use(express.static(publicPath));
        app.use((req, res) => {
            res.sendfile(publicPath + '/partials/layout.html');
        });

        for (var dirPath in routes.routings) {
            app.get(dirPath, routes.routings[dirPath]);
        }
    });

    app.configure('development', () => {
        app.use(express.logger('dev'));
        app.use(express.errorHandler());
    });

    var server = http.createServer(app);

    var ws = io.listen(server, { 'log level': 1 }, () => { });
    ws.on('connection', socket => {
        new routes.WebSocket(socket);
    });

    server.listen(port, ipaddress, null, function () {
        logger.info("Express server listening on port " + port);
    });
}

function printProperties(obj) {
    var properties = '';
    for (var prop in obj) {
        properties += prop + "=" + obj[prop] + "\n";
    }
    console.log(properties);
}