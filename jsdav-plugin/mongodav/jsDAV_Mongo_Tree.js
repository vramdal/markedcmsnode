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
 * @param {MongoDB collection} collection
 * @contructor
 */
var jsDAV_Mongo_Tree = module.exports = jsDAV_Tree.extend({

    initialize: function (basePath, mc) {
        this.basePath = basePath;
        this.mc = mc; // mc: MongoDB collection
    },

    getChildrenForNode: function(parent, cbfschildren) {
        var _this = this;
        var parentPath = (parent.path == "/" ? "" : parent.path).replace("/", "\\/");
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
        path = path.indexOf("/") != 0 ? "/" + path : path;
        this.mc.findOne({"path": path}, function(err, found) {
            if (err) {
                return cbfstree(err);
            }
            if (!found) {
                return cbfstree(new Exc.FileNotFound("File at location " + path + " not found"));
            }
            return _this.getNodeForDocument(found, cbfstree);
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
        }
        var result;
        if (clazz) {
            result = clazz.new(document.path, document, this);
            return callback(null, result);
        } else {
            return callback(new Exc.NotImplemented("File at " + path + " + has resource type " + document.resourceType + " which is not supported"));
        }
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
