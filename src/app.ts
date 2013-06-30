/// <reference path="d.ts/DefinitelyTyped/node/node.d.ts" />
/// <reference path="d.ts/DefinitelyTyped/express/express.d.ts" />

import express = require('express');
import http = module('http');
import path = module('path');
import routes = module('routes/index');

var app = (<any>express)();

app.configure(function(){
  app.set('port', process.env.NODE_PORT || 80);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.locals.pretty = true; // 綺麗な.htmlを吐く
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

routes.addRouting(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
