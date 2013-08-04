/// <reference path="DefinitelyTyped/node/node.d.ts"/>
/// <reference path="DefinitelyTyped/express/express.d.ts"/>

import fs = require('fs');
import express = require('express');
import http = require('http');
var path = require('path');
var log4js = require('log4js');
import routes = require('routes/index');

var LOG_DIRECTORY = path.dirname(process.argv[1]) + '/log'

log4js.configure({
    appenders: [{
        category: 'app',
        type: 'dateFile',
        filename: LOG_DIRECTORY + '/http.log',
        pattern: '-yyyy-MM-dd'
    }]
});
if (!fs.existsSync('LOG_DIRECTORY')) {
    fs.mkdirSync('LOG_DIRECTORY', '777');
}
var logger = log4js.getLogger('app');

var port = parseInt(process.argv[2], 10);
if (isNaN(port))
    port = 80;

var app = express();

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(function (req, res, next) {
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
    app.use(function (req, res, next) {
        res.status(404);
        res.render('404', {});
    });
    //app.locals.pretty = true; // 綺麗な.htmlを吐く
});

for (var path in routes.routings) {
    app.get(path, routes.routings[path]);
}

app.configure('development', function () {
    app.use(express.errorHandler());
});

http.createServer(app).listen(port, function () {
    console.log("Express server listening on port " + port);
});
