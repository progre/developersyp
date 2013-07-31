/// <reference path="../DefinitelyTyped/node/node.d.ts" />
/// <reference path="../DefinitelyTyped/express/express.d.ts" />

import http = module('http');

export function addRouting(app: ExpressApplication) {
    app.get('/', (req, res) => {
        res.render('index', { name: 'index' });
    });
    app.get('/list.html', (req, res) => {
        http.get('http://127.0.0.1:10080/', proxyResponse => {
            var body = '';
            proxyResponse.setEncoding('utf-8');
            proxyResponse.on('data', chunk => {
                body += chunk;
                if (proxyResponse.statusCode !== 200) {
                    (<any>res).statusCode = proxyResponse.statusCode;
                }
            });
            proxyResponse.on('end', () => {
                var channels = body.split('\r\n');
                res.render('list', { name: 'list', channels: channels.map(x => x.split('<>')).filter(x => x[0] !== '') });
            });
        }).on('error', e => {
                console.error("Got error: " + e.message);
                res.render('list', { name: 'list', channels: [] });
            });
    });
    app.get('/info.html', (req, res) => {
        res.render('info', { name: 'info' });
    });
    app.get('/terms.html', (req, res) => {
        res.render('terms', { name: 'terms' });
    });
    app.get('/index.txt', (req, res) => {
        http.get('http://127.0.0.1:10080/', proxyResponse => {
            var body = '';
            proxyResponse.setEncoding('utf-8');
            proxyResponse.on('data', chunk => {
                body += chunk;
                if (proxyResponse.statusCode !== 200) {
                    (<any>res).statusCode = proxyResponse.statusCode;
                }
            });
            proxyResponse.on('end', () => {
                res.send(body);
            });
        }).on('error', e => {
                console.error("Got error: " + e.message);
            });
    });
}
