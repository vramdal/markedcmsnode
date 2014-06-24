
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var publicContent = require("./routes/public");
var pageRoute = require("./routes/page");
var assetsRoute = require('./routes/assets');
var image = require('./routes/image');
var http = require('http');
var path = require('path');
var persistence = require('./persistence/' + process.env["persistence"]);

// New Code
var mongo = require('mongodb');
var monk = require('monk');
//var db = monk('localhost:27017/nodetest1');

var app = express();

// all environments
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/helloworld', routes.helloworld);
app.use('/userlist', routes.userlist(persistence));
// Se http://stackoverflow.com/a/15663862/253907
app.post("/assets", assetsRoute.upload(persistence));
app.get(/^\/assets\/(.*?)\/(\d*)x(\d*)$/, image.imageResize(persistence));
app.get(/^\/assets\/(.+?)\/sizes$/, image.suitableSizes(persistence));
app.use("/assets", express.static(__dirname + "/../assets"));
app.use("/public", express.static(__dirname + "/public"));
//app.all(/^\/content\/(.+)$/, routes.content(persistence));
app.get(/^\/(?!assets\/)(?!public\/)(.+)$/, pageRoute.viewContent(persistence));
//app.get(/^\/content\/(.+)$/, publicContent.viewContent(persistence));
//app.post(/^\/content\/(.+)$/, publicContent.saveContent(persistence));

app.use(function (err, req, res, next) {
	res.status(500);
	res.json({"error": err});
});
console.log("Starting on port ", app.get('port'));
// http://strongloop.com/strongblog/robust-node-applications-error-handling/
process.on('uncaughtException', function(err) {
	console.error("Handling uncaught exception", err, err.stack);
	process.exit();
});

http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port %d in %s mode", app.get("port"), app.settings.env);
});
