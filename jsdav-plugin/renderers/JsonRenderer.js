var Exc = require("./../../node_modules/jsDAV/lib/shared/exceptions");
var AbstractRenderer = require("./AbstractRenderer");

module.exports = AbstractRenderer.extend({
	/**
	 * Plugin name
	 *
	 * @var String
	 */
	name: "jsonRenderer",

    renderDocument: function(document, callback) {
        callback(null, JSON.stringify(document));
    },

    acceptsResourceType: function(/*resourceType*/) {
        return true;
    },

    getSupportedContentType: function() {
        return "application/json";
    },

	renderError: function(err, callback) {
        callback(null, JSON.stringify({"code": err.code, "message": err.message}));
	}
});
