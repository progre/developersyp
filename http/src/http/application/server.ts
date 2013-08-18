import http = require('http');
import path = require('path');
import express = require('express');
var ioClient = require('socket.io-client');
var log4js = require('log4js');
import routes = require('./routes/index');
import ch = require('./../domain/entity/channel');
import db = require('./../infrastructure/database');

export = execute;
function execute(ipaddress: string, port: number, publicPath: string) {
    var logger = log4js.getLogger('app');
    var app = express();

    app.configure(() => {
        app.set('views', __dirname + '/../userinterface');
        app.set('view engine', 'jade');
        //app.locals.pretty = true; // ãY—í‚È.html‚ð“f‚­

        for (var dirPath in routes.routings) {
            app.get(dirPath, routes.routings[dirPath]);
        }
        //app.get('/env', (req, res) => {
        //    var content = 'Version: ' + process.version + '\n<br/>\n' +
        //        'Env: {<br/>\n<pre>';
        //    for (var k in process.env) {
        //        content += ' ' + k + ': ' + process.env[k] + '\n';
        //    }
        //    content += '}\n</pre><br/>\n'
        //    res.send('<html>\n' +
        //        ' <head><title>Node.js Process Env</title></head>\n' +
        //        ' <body>\n<br/>\n' + content + '</body>\n</html>');
        //});

        app.use(express.favicon());
        app.use(express.bodyParser());
        app.use(express.methodOverride());
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
        app.use(app.router);
        app.use(express.static(publicPath));
        app.use((req, res, next) => {
            res.status(404);
            res.render('404', {});
        });
    });

    app.configure('development', () => {
        app.use(express.logger('dev'));
        app.use(express.errorHandler());
    });

    http.createServer(app).listen(port, ipaddress, null, function () {
        console.log("Express server listening on port " + port);
    });

    connectWebSocket();
}

function connectWebSocket(): void {
    var logger = log4js.getLogger('app');
    logger.info('connecting...');
    var server = ioClient.connect('ws://root-dp.prgrssv.net:7180', {
        'force new connection': true
    });
    var connected = false;
    server.on('connect', () => {
        logger.info('connected.');
        connected = true;
        server.on('deleteChannel', (channel: ch.Channel) => {
            var end = new Date();
            var begin = new Date(end.getTime());
            begin.setSeconds(begin.getSeconds() - channel.host.uptime);
            db.doneChannels.add({
                begin: begin,
                end: end,
                channel: channel
            });
        });
        server.on('disconnect', () => {
            logger.info('disconnect');
            connectWebSocket();
        });
    });
    server.on('error', err => {
        logger.error(JSON.stringify(err));
        server.disconnect();
        if (connected) {
            return;
        }
        connectWebSocket();
    });
}

function printProperties(obj) {
    var properties = '';
    for (var prop in obj) {
        properties += prop + "=" + obj[prop] + "\n";
    }
    console.log(properties);
}