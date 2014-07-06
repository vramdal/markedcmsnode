
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var assetsRoute = require('./routes/assets');
var rawRoute = require('./routes/raw');
var image = require('./routes/image');
var http = require('http');
var path = require('path');
var persistence = require('./persistence/' + process.env["persistence"]);
var serveContentNegotiator = require('./middleware/contentNegotiator');
var uploadContentNegotiator = require('./middleware/uploadContentNegotiator');
var markdownRoute = require('./routes/markdownRoute');
var ResourceResolver = require('./middleware/resourceResolver');
var rewrite = require('./middleware/requestRewriter');
var RendererResolver = require('./middleware/RendererResolver');
var pageRenderer = require('./renderers/pageRenderer');
var errorRenderer = require('./renderers/errorRenderer');
require("./util/polyfills");
var siteRootPath = process.env["filePersistence.rootDir"];
var responseProxy = require('./util/responseProxy');

// New Code
var mongo = require('mongodb');
var monk = require('monk');
//var db = monk('localhost:27017/nodetest1');

var app = express();


if (!siteRootPath) {
    throw new Error("No SITE_ROOT_PATH set");
}

var jsDAV_Server = require("jsDAV/lib/DAV/server");
console.log("jsDAV " + jsDAV_Server.VERSION + " is installed.");
var jsDAV = require("jsDAV/lib/jsdav");
// setting debugMode to TRUE outputs a LOT of information to console
//jsDAV.debugMode = true;
var jsDAV_Locks_Backend_FS = require("jsDAV/lib/DAV/plugins/locks/fs");
var locksBackend = jsDAV_Locks_Backend_FS.new(path.join(__dirname, "/jsdav-locks"));
/*
jsDAV.createServer({
    "node": path.join(siteRootPath),
    "locksBackend": locksBackend,
}, 8000);
*/

// From https://gist.github.com/touv/11045459
app.use(function(req, res, next) {
    if (req.url.search(/^\/.*\/$/) >= 0) {
        req.url = req.url + "index.page.json";
        req.headers["X-MarkedCMS-Render"] = "true";
    }
    next();
});
app.use(function(req, res, next) {
    if (req.headers["X-MarkedCMS-Render"]) {
        if (req.headers["if-modified-since"]) {
            delete req.headers["if-modified-since"];
        }
        if (req.headers["if-none-match"]) {
            delete req.headers["if-none-match"];
        }
        console.log("Page: " + req.url);
        responseProxy.makeProxy(res);
        next();
    } else {
        next();
    }
});
app.use(function (req, res, next) {
//	if (req.url.search(/^\/webdav/) >= 0) {
    var jsDavService = jsDAV.mount({
        node:           path.join(siteRootPath),
        mount:          "/",
        server:         req.app,
        standalone:     false,
        "locksBackend": locksBackend
    });
    jsDavService.exec(req, res);
//    next();
//	} else {
//		next();
//	}
});


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
//app.get('/users', user.list);
//app.get('/helloworld', routes.helloworld);
//app.use('/userlist', routes.userlist(persistence));
// Se http://stackoverflow.com/a/15663862/253907
app.post("/assets", assetsRoute.upload(persistence));
//app.get(/^\/assets\/(.*?)\/(\d*)x(\d*)$/, image.imageResize(persistence));
//app.get(/^\/assets\/(.+?)\/sizes$/, image.suitableSizes(persistence));
app.use("/assets", express.static(__dirname + "/../assets"));
app.use("/public", express.static(__dirname + "/public"));
//app.all(/^\/content\/(.+)$/, routes.content(persistence));

var resourceResolver = new ResourceResolver([persistence]);

var requestRendererResolver = new RendererResolver();
requestRendererResolver.registerRenderer("markedcms/page", pageRenderer(resourceResolver));
requestRendererResolver.registerRenderer("error/404", errorRenderer());


app.get(/^\/test\/.+$/,
		rewrite.path(/^\/test\/(.*)/, "/content/$1"),
		rewrite.lastPart(/(.+)/, "$1.page.json"),
        resourceResolver.resolveRequest(siteRootPath),
		requestRendererResolver.render(resourceResolver));

app.post(/^\/test\/.+$/,
		rewrite.path(/^\/test\/(.*)/, "/content/$1"),
		resourceResolver.resolveRequest(siteRootPath)
);

app.get(/^\/static\/.+$/, rawRoute.getStaticFile(persistence));
/*
app.get(/^\/(?!assets\/)(?!public\/)(?!(.*?\..+)$)(.+)$/, pageRoute.viewContent(persistence));
app.get(/^\/(?!assets\/)(?!public\/)(?!static\/).*?\..+$/,
        serveContentNegotiator.negotiator({
            "text/html": markdownRoute.preview(persistence)
        }, rawRoute.getFile(persistence)));
*/
app.post(/^\/(?!assets\/)(?!public\/)(?!static\/).*?\..+$/,
        uploadContentNegotiator.uploadNegotiator({
            "text/x-markdown": rawRoute.saveText(persistence),
            "multipart/form-data": assetsRoute.upload(persistence)
        }));
//app.get(/^\/content\/(.+)$/, publicContent.viewContent(persistence));
//app.post(/^\/content\/(.+)$/, publicContent.saveContent(persistence));

//noinspection JSUnusedLocalSymbols
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
