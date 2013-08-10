import http = require('http');
import path = require('path');
import express = require('express');
import routes = require('routes/index');
import adminApi = require('routes/admin-api');

export = execute;
function execute(ipaddress: string, port: number, publicPath: string, logger: any) {
    var app = express();

    app.configure(() => {
        app.set('views', __dirname + '/../userinterface');
        app.set('view engine', 'jade');
        //app.locals.pretty = true; // ãY—í‚È.html‚ð“f‚­

        for (var dirPath in routes.routings) {
            app.get(dirPath, routes.routings[dirPath]);
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
}