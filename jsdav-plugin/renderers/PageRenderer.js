var Exc = require("./../../node_modules/jsDAV/lib/shared/exceptions");
var RendererError = require("./RendererError");
var AbstractRenderer = require("./AbstractRenderer");
var async = require("async");
var jade = require("jade");
var md = require("marked");
var Path = require("path");
var Nodes = require('./../../node_modules/jade/lib/nodes');


module.exports = AbstractRenderer.extend({
	/**
	 * Plugin name
	 *
	 * @var String
	 */
	name: "pageRenderer",

	initialize: function() {
		console.log("Initializing PageRenderer");
        this.systemTemplatesDirectory = Path.join(__dirname, "./../../../views");
	},
	/**
	 * http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
	 * @param str
	 * @returns {string}
	 */
	escapeRegexString: function (str) {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	},
	renderDocument: function(page, callback) {
		var renderer = this;
		var prefetchSiteTemplates = function(pftCallback) {
			renderer.tree.getDocuments({"path": /^\/templates\/.*$/, "resourceType": "template"},
					function (err, foundTemplates) {
						if (err) {
							return pftCallback(err);
						}
						var templatesMap = {};
						for (var i = 0; i < foundTemplates.length; i++) {
							var template = foundTemplates[i];
							var name = template.path.substring(template.path.lastIndexOf("/") + 1);
							name = name.substring(0, name.lastIndexOf(".jade"));
							templatesMap[name] = template.content;
						}
						pftCallback(err, templatesMap);
					});
		};
		var fetchContent = function(fcCallback) {
			var toBeFetched = [];
			for (var slot in page.slots) {
				if (!page.slots.hasOwnProperty(slot)) {
					continue;
				}
                var fileName = page.slots[slot];
                var path = Path.resolve(page.path, fileName);
                toBeFetched.push(renderer.escapeRegexString(path));
			}
			var reg = new RegExp(toBeFetched.join("|"));
			renderer.tree.getDocuments({"path": reg, "resourceType": "content"}, function(err, foundDocuments) {
				if (err) {
					return fcCallback(err);
				}
				var contentMap = {};
				var filledSlots = {};
				for (var i = 0; i < foundDocuments.length; i++) {
					var foundDocument = foundDocuments[i];
					contentMap[foundDocument.path] = md(foundDocument.content);
					for (var slot in page.slots) {
						if (!page.slots.hasOwnProperty(slot)) {
							continue;
						}
                        var fileName = page.slots[slot];
                        var path = Path.resolve(page.path, fileName);
						if (path == foundDocument.path) {
							filledSlots[slot] = {
								id: foundDocument.path,
								html: md(foundDocument.content)
							}
						}
					}
				}
				fcCallback(err, filledSlots);
			})
		};
		var jadeCompile = function(templatesMap, filledSlots, callback) {
                if (!jade.Parser.prototype.originalParseExtends) {
                    jade.Parser.prototype.originalParseExtends = jade.Parser.prototype["parseExtends"];
                    jade.Parser.prototype.originalResolvePath = jade.Parser.prototype["resolvePath"];
                    jade.Parser.prototype.resolvePath = function(path, purpose) {
                        return this.originalResolvePath(path.replace('@', '/'), purpose); // Replace leading '@' with '/'
                    };
                    jade.Parser.prototype.parseExtends = function () {
                        var path = this.peek('extends').val.trim();
                        if (path.indexOf("@") != 0) {
                            path = this.expect('extends').val.trim();
                            path = Path.normalize(path).replace("\\", "/");
                            var self = this;
                            var str = templatesMap[path];
                            if (!str) {
                                return callback(new RendererError("Could not find template " + path));
                            }
                            console.log("Extender: " + str);
                            var parser = new this.constructor(str, path, this.options);

                            parser.blocks = this.blocks;
                            parser.contexts = this.contexts;
                            self.extending = parser;


                            // TODO: null node
                            return new Nodes.Literal('');
                        } else {
                            return this.originalParseExtends();
                        }
                    }
                }
            try {
                var templateFn = jade.compile(templatesMap[page.template], {
                            'filename': "/" + page.template + ".jade",
                            'pretty':  true,
                            'basedir': __dirname + "../../../views"}
                );
                var html = templateFn(filledSlots);
                callback(null, html);
            } catch (e) {
                callback(e);
            }
		};
		async.parallel([prefetchSiteTemplates, fetchContent], function(err, results) {
			if (err) {
				return callback(err);
			}
			jadeCompile(results[0], results[1], callback);
		});
    },

    acceptsResourceType: function(resourceType) {
        return resourceType == "page";
    },

    getSupportedContentType: function() {
        return "text/html";
    },

	renderError: function(err, callback) {
        callback(null, "<h1>" + err.code + " " + err.message + "</h1>");
	}

});
