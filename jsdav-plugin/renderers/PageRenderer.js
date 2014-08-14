var Exc = require("./../../node_modules/jsDAV/lib/shared/exceptions");
var AbstractRenderer = require("./AbstractRenderer");

module.exports = AbstractRenderer.extend({
	/**
	 * Plugin name
	 *
	 * @var String
	 */
	name: "pageRenderer",

    renderDocument: function(document, callback) {
        callback(null, document.title);
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
