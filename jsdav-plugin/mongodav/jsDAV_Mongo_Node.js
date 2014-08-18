/*
 * @package jsDAV
 * @subpackage DAV
 * @copyright Copyright(c) 2011 Ajax.org B.V. <info AT ajax DOT org>
 * @author Mike de Boer <info AT mikedeboer DOT nl>
 * @license http://github.com/mikedeboer/jsDAV/blob/master/LICENSE MIT License
 */
"use strict";

var jsDAV_iNode = require("./../../node_modules/jsDAV/lib/DAV/interfaces/iNode");
var mongojs = require("mongojs");

var Fs = require("fs");
var Util = require("./../../node_modules/jsDAV/lib/shared/util");

var jsDAV_Mongo_Node = module.exports = jsDAV_iNode.extend({
    initialize: function(path) {
        this.path = path;
        this.isNew = false;
    },

    setNew: function(isNew) {
        this._isNew = isNew;
    },

    isNew: function() {
        return this._isNew;
    },

    setConnection: function(mongoConnection) {
        this.connection = mongoConnection;
    },

    /**
     * Returns the name of the node
     *
     * @return {string}
     */
    getName: function() {
        return Util.splitPath(this.path)[1];
    },

    /**
     * Renames the node
     *
     * @param {string} name The new name
     * @return void
     * @param cbfssetname
     */
    setName: function(name, cbfssetname) {  // TODO
        var parentPath = Util.splitPath(this.path)[0];
        var newName    = Util.splitPath(name)[1];

        var newPath = parentPath + "/" + newName;
        var self = this;
        Fs.rename(this.path, newPath, function(err) {
            if (err)
                return cbfssetname(err);
            self.path = newPath;
            cbfssetname();
        });
    },

    /**
     * Returns the last modification time, as a unix timestamp
     *
     * @return {Number}
     */
/*
    getLastModified: function(cbfsgetlm) { // TODO
        cbfsgetlm(null, this.lastModified);
        if (this.$stat)
            return cbfsgetlm(null, this.$stat.mtime);
        Fs.stat(this.path, function(err, stat) {
            if (err || typeof stat == "undefined")
                return cbfsgetlm(err);
            //_self.$stat = stat;
            cbfsgetlm(null, stat.mtime);
        });
    },
*/

    /**
     * Returns whether a node exists or not
     *
     * @return {Boolean}
     */
    exists: function(cbfsexist) {  // TODO
        Fs.exists(this.path, cbfsexist);
    }
});
