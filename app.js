var express = require('express');
var http = require('http');
var path = require('path');
var log4js = require('log4js');
var routes = require("./routes/index");

log4js.configure({
    appenders: [
        {
            category: 'app',
            type: 'dateFile',
            filename: 'logs/access.log',
            pattern: '-yyyy-MM-dd'
        }
    ]
});
var logger = log4js.getLogger('app');

var app = express();

app.configure(function () {
    app.set('port', process.env.NODE_PORT || 80);
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
    app.locals.pretty = true;
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

routes.addRouting(app);

http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});

//@ sourceMappingURL=file:///E:/Developments/node/yp/app.js.map
