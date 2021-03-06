
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var assetsRoute = require('./routes/assets');
var rawRoute = require('./routes/raw');
var http = require('http');
var path = require('path');
var persistence = require('./persistence/' + process.env["persistence"]);
var pageRenderer = require('./renderers/pageRenderer');
var markdownContentRenderer = require('./renderers/markdownContentRenderer');
var pageCompiler = require("./routes/pageCompiler");
var markdownContentCompiler = require("./routes/markdownContentCompiler");
require("./util/polyfills");
var siteRootPath = process.env["filePersistence.rootDir"];
var jsDAV_Util = require("jsDAV/lib/shared/util");
var fs = require("fs");
var passport = require('passport');
var GoogleStrategy = require('passport-google').Strategy;
var async = require("async");
var mime = require("mime");
var jsDAV_AuthorizationPlugin = require("./jsdav-plugin/authorization/AuthorizationPlugin");


// New Code
var mongo = require('mongodb');
var monk = require('monk');
//var db = monk('localhost:27017/nodetest1');

mime.define({"text/jade": ["jade"]});
mime.define({"text/markdown": ["md"]});

var compilers = {
    "X-mdcms/page": pageCompiler,
    "X-mdcms/md-content": markdownContentCompiler
};

var renderers = {
    "X-mdcms/page": pageRenderer,
    "X-mdcms/md-content": markdownContentRenderer
};
var app = express();


if (!siteRootPath) {
    throw new Error("No SITE_ROOT_PATH set");
}

var jsDAV_Server = require("jsDAV/lib/DAV/server");
console.log("jsDAV " + jsDAV_Server.VERSION + " is installed.");
var jsDAV = require("jsDAV/lib/jsdav");
// setting debugMode to TRUE outputs a LOT of information to console
//jsDAV.debugMode = true;
//var jsDAV_Locks_Backend_FS = require("jsDAV/lib/DAV/plugins/locks/fs");
//var locksBackend = jsDAV_Locks_Backend_FS.new(path.join(__dirname, "/jsdav-locks"));
var jsDAV_Auth_Backend_MarkedCMS = require("./jsdav-plugin/AuthPlugin");
var RendererDispatcherPlugin = require("./jsdav-plugin/RendererDispatcherPlugin");
RendererDispatcherPlugin.renderers = [
        require("./jsdav-plugin/renderers/JsonRenderer"),
        require("./jsdav-plugin/renderers/PageRenderer")
];
var profiler;
if (process.env.NODE_ENV !== 'production'){  // See https://github.com/mattinsler/longjohn
//    var longjohn = require('longjohn');
//    longjohn.empty_frame = 'ASYNC CALLBACK';  // defaults to '---------------------------------------------'
//    profiler = require('v8-profiler'); // http://docs.nodejitsu.com/articles/getting-started/how-to-debug-nodejs-applications
}/*
jsDAV.createServer({
    "node": path.join(siteRootPath),
    "locksBackend": locksBackend,
}, 8000);
*/

// From https://gist.github.com/touv/11045459
var mongojs = require("mongojs");
var db = mongojs(process.env["mongoConnectString"], ["content", "users"]);
var authBackend = jsDAV_Auth_Backend_MarkedCMS.new(db["users"]);

var jsDavService;
var collection = undefined;
var initJsDav = function(err, collection) {
    if (err) {
        console.error(err);
        return;
    }
    var jsDAV_Mongo_Tree = require("./jsdav-plugin/mongodav/jsDAV_Mongo_Tree").new("/", collection);
    jsDavService = jsDAV.mount({
//            node: "/Users/vramdal/temp/markedcms-content",
        tree:          jsDAV_Mongo_Tree,
        mount:         "/",
        server:        app,
        standalone:    false,
        //    "locksBackend": locksBackend,
        "authBackend": authBackend,
        plugins:       jsDAV_Util.extend({
			"authorizationPlugin": jsDAV_AuthorizationPlugin,
            "rendererDispathcerPlugin": RendererDispatcherPlugin
        }, jsDAV_Server.DEFAULT_PLUGINS)
    });
};

db.getCollectionNames(function(err, collectionNames) {
    for (var i = 0; i < collectionNames.length; i++) {
        var collectionName = collectionNames[i];
        if (collectionName == "content") {
            collection = db["content"];
            return initJsDav(null, collection);
        }
    }
    if (!collection) {
        db.createCollection("content", {}, function(err, createdCollection) {
            if (err) {
                return console.error(err);
            }
            collection = createdCollection;
            console.log("Empty database, populating it with default content");
            var contentArray = JSON.parse(fs.readFileSync(path.join(__dirname, "jsdav-plugin", "mongodav", "default-content.json")));
			async.eachSeries([
				{fieldOrSpec: {"path": 1}, options: {unique: true}/*},
				{fieldOrSpec: {"content": "text"}, options: {default_language: "norwegian", language_override: "language"}*/}
			], function(indexSpec, callback) {
				collection.ensureIndex(indexSpec.fieldOrSpec, indexSpec.options, callback);
			}, function(err) {
				if (err) {
					console.error("Error creating indexes: ", err);
				}
			});
            async.eachSeries(contentArray, function(contentDocument, callback) {
                contentDocument.lastModified = new Date();
                contentDocument.created = new Date();
                collection.insert(contentDocument, callback);
            }, function(err) {
                if (err) {
                    console.error("Error populating database", err);
                    return;
                }
                console.log("Done populating database");
                return initJsDav(null, createdCollection);
            });
        });
    }


});

app.use("/public", express.static(__dirname + "/public"));
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT);
app.set("hostname", process.env.HOSTNAME || "localhost");
var port = app.get("port") ? app.get("port") : 80;
var portStr = port == 80 ? "" : ":" + port;
passport.use(new GoogleStrategy({
            returnURL: "http://" + app.get("hostname") + portStr + "/auth/google/return",
            realm: "http://" + app.get("hostname") + portStr
        },
        function(identifier, profile, done) {
            console.log("Google", identifier);
            done(null, profile);
        }
));
passport.serializeUser(function(user, done) {
  done(null, user.emails[0].value);
});

passport.deserializeUser(function(id, done) {
    done(null, {id: id, email: id, name: "Vidar"});
/*
  User.findById(id, function(err, user) {
    done(err, user);
  });
*/
});
app.configure(function() {
    app.use(express.cookieParser('your secret here'));
    app.use(express.session({ secret: 'keyboard rabbit' }));
    app.use(passport.initialize());
    app.use(passport.session());
});

var jsDAV_Collection = require("./node_modules/jsDAV/lib/DAV/collection");
app.get("/export", function(req, res, next) {
	var jsonDump = [];
	collection.find({"path": /^.*$/}, function(err, documents) {
		for (var i = 0; i < documents.length; i++) {
			var document = documents[i];
			jsonDump.push(document);
		}
		res.json(jsonDump);
	});
});

app.get('/auth/google', function(req, res, next) {
    req.session.goAfterLogin = req.headers["referer"];
    next();
});
app.get('/auth/google', passport.authenticate('google'));
app.get('/auth/google/return',
        passport.authenticate('google'),
        function(req, res) {
            res.redirect(req.session.goAfterLogin ? req.session.goAfterLogin : "/");
        });
app.get("/auth/logout", function(req, res, next) {
    req.session.goAfterLogin = undefined;
    req.logout();
    res.redirect(req.headers["referer"] ? req.headers["referer"] : "/");
});
app.all("*",
        function(req, res, next) {
            if (profiler) {
                profiler.takeSnapshot("snapshot-1");
                profiler.startProfiling("profile-1");
            }
            jsDavService.exec(req, res);
            if (profiler) {
                profiler.stopProfiling("profile-1");
                profiler.takeSnapshot("snapshot-2");
            }
		}

);

// all environments
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
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
app.use("/assets", express.static(__dirname + "/../assets"));
//app.all(/^\/content\/(.+)$/, routes.content(persistence));

//var resourceResolver = new ResourceResolver([persistence]);

//var requestRendererResolver = new RendererResolver();
//requestRendererResolver.registerRenderer("markedcms/page", pageRenderer(resourceResolver));
//requestRendererResolver.registerRenderer("error/404", errorRenderer());


/*
app.get(/^\/test\/.+$/,
		rewrite.path(/^\/test\/(.*)/, "/content/$1"),
		rewrite.lastPart(/(.+)/, "$1.page.json"),
        resourceResolver.resolveRequest(siteRootPath),
		requestRendererResolver.render(resourceResolver));

app.post(/^\/test\/.+$/,
		rewrite.path(/^\/test\/(.*)/, "/content/$1"),
		resourceResolver.resolveRequest(siteRootPath)
);

*/
app.get(/^\/static\/.+$/, rawRoute.getStaticFile(persistence));

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
    console.log("Express server listening on port %d in %s mode", port, app.settings.env);
});
