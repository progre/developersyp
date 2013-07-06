var http = require('http');

function addRouting(app) {
    app.get('/', function (req, res) {
        res.render('index', { name: 'index' });
    });
    app.get('/list.html', function (req, res) {
        http.get('http://127.0.0.1:10080/', function (proxyResponse) {
            var body = '';
            proxyResponse.setEncoding('utf-8');
            proxyResponse.on('data', function (chunk) {
                body += chunk;
                if (proxyResponse.statusCode !== 200) {
                    (res).statusCode = proxyResponse.statusCode;
                }
            });
            proxyResponse.on('end', function () {
                var channels = body.split('\r\n');
                res.render('list', { name: 'list', channels: channels.map(function (x) {
                        return x.split('<>');
                    }).filter(function (x) {
                        return x[0] !== '';
                    }) });
            });
        }).on('error', function (e) {
            console.error("Got error: " + e.message);
            res.render('list', { name: 'list', channels: [] });
        });
    });
    app.get('/info.html', function (req, res) {
        res.render('info', { name: 'info' });
    });
    app.get('/terms.html', function (req, res) {
        res.render('terms', { name: 'terms' });
    });
    app.get('/index.txt', function (req, res) {
        http.get('http://127.0.0.1:10080/', function (proxyResponse) {
            var body = '';
            proxyResponse.setEncoding('utf-8');
            proxyResponse.on('data', function (chunk) {
                body += chunk;
                if (proxyResponse.statusCode !== 200) {
                    (res).statusCode = proxyResponse.statusCode;
                }
            });
            proxyResponse.on('end', function () {
                res.send(body);
            });
        }).on('error', function (e) {
            console.error("Got error: " + e.message);
        });
    });
}
exports.addRouting = addRouting;

//@ sourceMappingURL=file:///E:/Developments/node/yp/routes/index.js.map
