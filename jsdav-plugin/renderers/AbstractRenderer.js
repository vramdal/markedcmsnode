var Base = require("./../../node_modules/jsDAV/lib/shared/base");

var Exc = require("./../../node_modules/jsDAV/lib/shared/exceptions");

//noinspection JSUnusedLocalSymbols
module.exports = Base.extend({
	/**
	 * Plugin name
	 *
	 * @var String
	 */
	name: undefined,

    getSupportedContentType: function() {
        return "";
    },

    renderDocument: function(document, callback) {
        callback();
    },
    acceptsResourceType: function(resourceType) {
        return false;
    },

	renderError: function(err, callback) {
        callback(null, "Error");
	}
});
