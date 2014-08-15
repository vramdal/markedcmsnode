var Exc = require("./../../node_modules/jsDAV/lib/shared/exceptions");
var AbstractRenderer = require("./AbstractRenderer");
var async = require("async");
var jade = require("jade");

module.exports = AbstractRenderer.extend({
	/**
	 * Plugin name
	 *
	 * @var String
	 */
	name: "pageRenderer",

    renderDocument: function(page, callback) {
        this.resourceFetcher("/templates/" + page.template, function(err, template) {
            if (err) {
                return callback(err);
            }
            jade.compile(template.content);
        });
        callback(null, page.title);
    },

    acceptsResourceType: function(resourceType) {
        return resourceType == "page";
    },

    getSupportedContentType: function() {
        return "text/html";
    },

	renderError: function(err, callback) {
        callback(null, "<h1>" + err.code + " " + err.message);
	}

});
