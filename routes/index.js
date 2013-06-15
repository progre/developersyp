var http = require('http')
function index(req, res) {
    res.render('index', {
        title: 'Express'
    });
}
exports.index = index;
function indextxt(req, res) {
    http.get('http://127.0.0.1:10080/', function (proxyResponse) {
        var body = '';
        proxyResponse.setEncoding('utf-8');
        proxyResponse.on('data', function (chunk) {
            body += chunk;
            if(proxyResponse.statusCode !== 200) {
                (res).statusCode = proxyResponse.statusCode;
            }
        });
        proxyResponse.on('end', function () {
            res.send(body);
        });
    }).on('error', function (e) {
        console.log("Got error: " + e.message);
    });
}
exports.indextxt = indextxt;
//@ sourceMappingURL=file:///E:/Developments/node/yp/routes/index.js.map
