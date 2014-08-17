/*
 * @package jsDAV
 * @subpackage DAV
 * @copyright Copyright(c) 2011 Ajax.org B.V. <info AT ajax DOT org>
 * @author Mike de Boer <info AT mikedeboer DOT nl>
 * @license http://github.com/mikedeboer/jsDAV/blob/master/LICENSE MIT License
 */
"use strict";

var jsDAV_Tree = require("./../../node_modules/jsDAV/lib/DAV/tree");
var jsDAV_Mongo_Directory = require("./jsDAV_Mongo_Directory");
var jsDAV_Mongo_File = require("./jsDAV_Mongo_File");
var async = require("async");
var Util = require("./../../node_modules/jsDAV/lib/shared/util");
var Exc = require("./../../node_modules/jsDAV/lib/shared/exceptions");

/**
 * jsDAV_Tree_Filesystem
 *
 * Creates this tree
 * Supply the path you'd like to share.
 *
 * @param {String} basePath
 * @param {Object} collection
 * @contructor
 */
module.exports = jsDAV_Tree.extend({

    initialize: function (basePath, mc) {
        this.basePath = basePath;
        this.mc = mc; // mc: MongoDB collection
    },

    getChildrenForNode: function(parent, cbfschildren) {
        var _this = this;
        var parentPath = this.escapeRegexString(parent.path == "/" ? "" : parent.path);
//        parentPath = parentPath.replace("/", "\\/");
        var reg = new RegExp("^" + ( parentPath) + "\/[^\/]+$");
        this.mc.find({"path": reg}, function(err, documents) {
            async.map(documents, _this.getNodeForDocument, cbfschildren);
        });
    },
    /**
     * Returns a new node for the given path
     *
     * @param {String} path
     * @param {Function} cbfstree
     * @return void
     */
    getNodeForPath: function (path, cbfstree) {
        var _this = this;
        this.getDocumentForPath(path, function(err, document) {
            if (err) {
                return cbfstree(err);
            }
            return _this.getNodeForDocument(document, cbfstree);
        });
    },

    getDocumentForPath: function(path, callback) {
        path = path.indexOf("/") != 0 ? "/" + path : path;
        this.mc.findOne({"path": path}, function(err, found) {
            if (!found) {
                return callback(new Exc.FileNotFound("File at location " + path + " not found"));
            }
            return callback(err, found);
        });
    },

    /**
     * Returns a new node for the given MongoDB document
     * @param document A MongoDB document
     * @param {Function} callback
     * @returns {void}
     */
    getNodeForDocument: function(document, callback) {
        var clazz = undefined;
        switch (document.resourceType) {
            case "page": clazz = jsDAV_Mongo_Directory; break;
            case "folder": clazz = jsDAV_Mongo_Directory; break;
            case "content": clazz = jsDAV_Mongo_File; break;
            case "template": clazz = jsDAV_Mongo_File; break;
            default: clazz = jsDAV_Mongo_File;
        }
        var result;
        if (clazz) {
            result = clazz.new(document.path, document, this);
            return callback(null, result);
        } else {
            return callback(new Exc.NotImplemented("File at " + document.path + " + has resource type " + document.resourceType + " which is not supported"));
        }
    },

	getDocuments: function(queryObj, callback) {
		this.mc.find(queryObj, callback);
	},

    /**
     * Returns the real filesystem path for a webdav url.
     *
     * @param {String} publicPath
     * @return string
     */
    getRealPath: function (publicPath) {      // TODO: Remove
        return Util.rtrim(this.basePath, "/") + "/" + Util.trim(publicPath, "/");
    },

	/**
	 * Copies a file or directory.
	 *
	 * This method must work recursively and delete the destination
	 * if it exists
	 *
	 * @param {String} source
	 * @param {String} destination
	 * @return void
	 * @param cbfscopy
	 */
    copy: function (source, destination, cbfscopy) {  // TODO
        source = this.getRealPath(source);
        destination = this.getRealPath(destination);
        this.realCopy(source, destination, cbfscopy);
    },

	/**
	 * Used by self::copy
	 *
	 * @param {String} sourcePath
	 * @param {String} destinationPath
	 * @return void
	 * @param cbfsrcopy
	 */
    realCopy: function (sourcePath, destinationPath, cbfsrcopy) {
        var _this = this;
        if (!this.insideSandbox(destinationPath)) {
            return cbfsmove(new Exc.Forbidden("You are not allowed to copy to " +
                    this.stripSandbox(destinationPath)));
        }
        async.series([
                    function(callback) {
                        _this.mc.findOne({"path": sourcePath}, function(err, foundSourceDoc) {
                            if (err || !foundSourceDoc) {
                                return callback(err || new Exc.FileNotFound("File at location " + path + " not found"));
                            } else {
                                return callback(null, foundSourceDoc);
                            }
                        });
                    },
                    function(callback) {
                        _this.mc.remove({"path": destinationPath}, callback);
                    }
                ],
                function(err, results) {
                    var sourceDoc = results[0];
                    sourceDoc.path = destinationPath;
                    delete sourceDoc._id;
                    _this.mc.insert(sourceDoc);
                    cbfsrcopy(null);
                }
        );
    },

	/**
	 * Moves a file or directory recursively.
	 *
	 * If the destination exists, delete it first.
	 *
	 * @param {String} sourcePath
	 * @param {String} destinationPath
	 * @return void
	 * @param cbfsmove
	 */
    move: function (sourcePath, destinationPath, cbfsmove) {  // TODO
        var _this = this;
        sourcePath = this.getRealPath(sourcePath);
        destinationPath = this.getRealPath(destinationPath);
        if (!this.insideSandbox(destinationPath)) {
            return cbfsmove(new Exc.Forbidden("You are not allowed to move to " +
                    this.stripSandbox(destinationPath)));
        }
        async.series([
                    function(callback) {
                        return _this.getDocumentForPath(sourcePath, callback);
                    },
                    function(callback) {
                        return _this.mc.remove({"path": destinationPath}, callback);
                    }
                ],
                function(err, results) {
                    var sourceDoc = results[0];
                    sourceDoc.path = destinationPath;
                    return _this.mc.update({"_id": sourceDoc._id}, sourceDoc, function(err) {
                        cbfsmove(err, sourcePath, destinationPath);
                    });
                }
        );
    },
    /**
     * http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
     * @param str
     * @returns {string}
     */
    escapeRegexString: function(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    },
    deletePath: function(path, cbfsfiledel) {
        path = this.escapeRegexString(path == "/" ? "" : path);
        var reg = new RegExp("^" + (path) + "(\/[^\/]+)*$");
        this.mc.remove({"path": reg}, cbfsfiledel);
    }
});
