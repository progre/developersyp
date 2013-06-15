/// <reference path="../d.ts/DefinitelyTyped/node/node.d.ts" />
/// <reference path="../d.ts/DefinitelyTyped/express/express.d.ts" />

import http = module('http');

export function index(req, res) {
    res.render('index', {
        title: 'Express'
    });
}

export function indextxt(req: ExpressServerRequest, res: ExpressServerResponse) {
    http.get('http://127.0.0.1:10080/', proxyResponse => {
        var body = '';
        proxyResponse.setEncoding('utf-8');
        proxyResponse.on('data', chunk => {
            body += chunk;
            if (proxyResponse.statusCode !== 200) {
                (<any>res).statusCode = proxyResponse.statusCode;
            }
        } );
        proxyResponse.on('end', () => {
            res.send(body);
        } );
    } ).on('error', e => {
            console.error("Got error: " + e.message);
        } );
}