/// <reference path="DefinitelyTyped/node/node.d.ts"/>
/// <reference path="DefinitelyTyped/express/express.d.ts"/>

import fs = require('fs');
import express = require('express');
import http = require('http');
var path = require('path');
var log4js = require('log4js');
import routes = require('routes/index');
import adminApi = require('routes/admin-api');

var LOG_DIRECTORY = path.dirname(process.argv[1]) + '/log'

log4js.configure({
    appenders: [{
        category: 'app',
        type: 'dateFile',
        filename: LOG_DIRECTORY + '/http.log',
        pattern: '-yyyy-MM-dd'
    }]
});
if (!fs.existsSync(LOG_DIRECTORY)) {
    fs.mkdirSync(LOG_DIRECTORY, '777');
}
var logger = log4js.getLogger('app');

var ipaddress = process.env.OPENSHIFT_INTERNAL_IP || process.env.OPENSHIFT_NODEJS_IP || 'localhost';
var port = parseInt(process.argv[2], 10);
if (isNaN(port)) {
    port = process.env.OPENSHIFT_INTERNAL_PORT || process.env.OPENSHIFT_NODEJS_PORT || 80;
}

var app = express();

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    //app.locals.pretty = true; // 綺麗な.htmlを吐く

    () => {
        for (var path in routes.routings) {
            app.get(path, routes.routings[path]);
        }
        app.get('/env', (req, res) => {
            var content = 'Version: ' + process.version + '\n<br/>\n' +
                'Env: {<br/>\n<pre>';
            for (var k in process.env) {
                content += ' ' + k + ': ' + process.env[k] + '\n';
            }
            content += '}\n</pre><br/>\n'
            res.send('<html>\n' +
                ' <head><title>Node.js Process Env</title></head>\n' +
                ' <body>\n<br/>\n' + content + '</body>\n</html>');
        });
    } ();

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
    app.use(express.static(path.join(__dirname, 'public')));
    app.use((req, res, next) => {
        res.status(404);
        res.render('404', {});
    });
});

app.configure('development', function () {
    app.use(express.logger('dev'));
    app.use(express.errorHandler());
});

http.createServer(app).listen(port, ipaddress, null, function () {
    console.log("Express server listening on port " + port);
});
