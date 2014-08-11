var jsDAV_iNode = require("./../../node_modules/jsDAV/lib/DAV/interfaces/iNode");
var jsDAV_Mongo_Directory = require("./jsDAV_Mongo_Directory");
var Exc = require("./../../shared/exceptions");

/**
 * Principal Collection interface.
 *
 * Implement this interface to ensure that your principal collection can be
 * searched using the principal-property-search REPORT.
 */
var jsDAV_Mongo_Root = module.exports = jsDAV_Mongo_Directory.extend({
    initialize: function(path, db) {
        this.path = path;
        this.db = db;
    },

    getChildren: function(callback) {
        this.db.pages.find()
    }
});
