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
var mongojs = require("mongojs");

var Fs = require("fs");
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
 * @contructor
 */
var jsDAV_Mongo_Tree = module.exports = jsDAV_Tree.extend({

    initialize: function (basePath, db) {
        this.basePath = basePath;
        this.db = db;
    },

    jsonPath: function(root, path, closestMatch, accumulatedPath) { // BROKEN: Funker ikke med datamodellen
        var reg = /\/([^\/]+)(.*)/;
        var results = reg.exec(path);
        if (path == "/") {
            return {
                match: root,
                path: path
            }
        }
        var propertyName = results[1];
        accumulatedPath = accumulatedPath || "";
        accumulatedPath = accumulatedPath + "/" + propertyName ;
        var rest = results[2];
        if (root[propertyName] && rest) {
            return this.jsonPath(root[propertyName], rest, accumulatedPath);
        } else if (root[propertyName]) {
            return {
                match: root[propertyName],
                path: accumulatedPath
            }
        } else {
            return {
                closestMatch: root,
                path: accumulatedPath,
                rest: rest
            }
        }
    },
    getStructure: function(callback) {
        this.db.structure.find({"_id": "structure"}, function(err, structureNode) {
            callback(null, structureNode);
        });
    },

    getRootNode: function(callback) {
        var _this = this;
        this.getStructure(function(err, structureNode) {
            callback(null, jsDAV_Mongo_Directory.new("/", _this.db))
        });
    },

    getChildrenForPage: function(parentPage, cbfschildren) {
        var _this = this;
        var parentPath = (parentPage.path == "/" ? "" : parentPage.path);
        parentPath = parentPath.replace("/", "\\/");
        var reg = new RegExp("^" + ( parentPath) + "\/[^\/]+$");
        async.parallel([
                    function(callback) {
                        var pagesArr = [];
                        _this.db.pages.find({"path": reg}, function(err, pages) {
                            for (var i = 0; i < pages.length; i++) {
                                var page = pages[i];
                                pagesArr.push(jsDAV_Mongo_Directory.new(page.path, page, _this));
                            }
                            return callback(err, pagesArr);
                        });
                    },
                    function(callback) {
                        var contentArr = [];
                        _this.db.content.find({"pageId": parentPage._id}, function(err, contentDocs) {
                            for (var i = 0; i < contentDocs.length; i++) {
                                var contentDoc = contentDocs[i];
                                contentArr.push(jsDAV_Mongo_File.new((parentPage.path == "/" ? "/" : parentPage.path + "/") + contentDoc.name, contentDoc));
                            }
                            return callback(err, contentArr);
                        });
                    }
                ],
                function(err, results) {
                    return cbfschildren(err, results[0].concat(results[1]));
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
        path = path.indexOf("/") != 0 ? "/" + path : path;
        var page = undefined;
        async.series([
                    function(callback) {
                        _this.db.pages.findOne({"path": path}, function(err, foundPage) {
                            page = foundPage;
                            return callback(err, foundPage);
                        })
                    },
                    function(callback) {
                        if (!page) {
                            var parentPagePath;
                            if (path.lastIndexOf("/") == 0) {
                                parentPagePath = "/";
                            } else {
                               parentPagePath = path.substring(0, path.lastIndexOf("/"));
                            }
                            _this.db.pages.findOne({"path": parentPagePath}, function(err, foundPage) {
                                page = foundPage;
                                return callback(err, foundPage);
                            });
                        } else {
                            return callback(null, null);
                        }
                    },
                    function(callback) {
                        if (page && page.path != path) {
/*
                            var parentPagePath;
                            if (path.lastIndexOf("/") == 0) {
                                parentPagePath = "/";
                            } else {
                               parentPagePath = path.substring(path.lastIndexOf("/") + 1);
                            }
*/
                            var filename = path.substring(page.path == "/" ? 1 : page.path.length + 1);
                            _this.db.content.findOne({"pageId": page._id, "name": filename}, function(err, foundContent) {
                                return callback(err, foundContent);
                            });
                        } else {
                            return callback(null, null);
                        }
                    }
                ],
                function(err, results) {
                    var foundContent = results[2];
                    var page = results[0] || results[1];
                    if (err) {
                        return cbfstree(err);
                    } else if (foundContent) { // Content
                        return cbfstree(err, jsDAV_Mongo_File.new((page.path == "/" ? "/" : page.path  + "/") + foundContent.name, foundContent, _this));
                    } else if (results[0]) { // Page
                        return cbfstree(err, jsDAV_Mongo_Directory.new(page.path, page, _this));
                    } else { // Nothing
                        return cbfstree(new Exc.FileNotFound("File at location " + path + " not found"));
                    }
                }
        );
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
     */
    copy: function (source, destination, cbfscopy) {  // TODO
        source = this.getRealPath(source);
        destination = this.getRealPath(destination);
        this.realCopy(source, destination, cbfscopy);
    },

    /**
     * Used by self::copy
     *
     * @param {String} source
     * @param {String} destination
     * @return void
     */
    realCopy: function (source, destination, cbfsrcopy) {  // TODO: Remove
        /*
         if (!this.insideSandbox(destination)) {
         return cbfsrcopy(new Exc.Forbidden("You are not allowed to copy to " +
         this.stripSandbox(destination)));
         }

         Fs.stat(source, function (err, stat) {
         if (!Util.empty(err))
         return cbfsrcopy(err);
         if (stat.isFile())
         Async.copyfile(source, destination, true, cbfsrcopy);
         else
         Async.copytree(source, destination, cbfsrcopy);
         });
         */
    },

    /**
     * Moves a file or directory recursively.
     *
     * If the destination exists, delete it first.
     *
     * @param {String} source
     * @param {String} destination
     * @return void
     */
    move: function (source, destination, cbfsmove) {  // TODO
        source = this.getRealPath(source);
        destination = this.getRealPath(destination);
        if (!this.insideSandbox(destination)) {
            return cbfsmove(new Exc.Forbidden("You are not allowed to move to " +
                    this.stripSandbox(destination)));
        }
        Fs.rename(source, destination, function (err) {
            cbfsmove(err, source, destination);
        });
    }
});
