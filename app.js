var express = require('express');
var http = require('http');
var path = require('path');
var routes = require("./routes/index");

var app = (express)();

app.configure(function () {
    app.set('port', process.env.NODE_PORT || 80);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
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
