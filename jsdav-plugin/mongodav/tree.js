/*
 * @package jsDAV
 * @subpackage DAV
 * @copyright Copyright(c) 2011 Ajax.org B.V. <info AT ajax DOT org>
 * @author Mike de Boer <info AT mikedeboer DOT nl>
 * @license http://github.com/mikedeboer/jsDAV/blob/master/LICENSE MIT License
 */
"use strict";

var jsDAV_Tree = require("./../../node_modules/jsDAV/lib/DAV/tree");
var jsDAV_FS_Directory = require("./../../node_modules/jsDAV/lib/DAV/directory");
var jsDAV_FS_File = require("./../../node_modules/jsDAV/lib/DAV/file");
var mongojs = require("mongojs");

var Fs = require("fs");
var Async = require("asyncjs");
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
var jsDAV_Tree_Filesystem = module.exports = jsDAV_Tree.extend({

	db: undefined, // mongojs

	setDbConnection: function(dbConnection) {
		this.db = dbConnection;
	},

	initialize: function (basePath) {
		this.basePath = basePath;
	},

	jsonPath: function(root, path) {
		var reg = /\/([^\/]+)(.*)/;
		var results = reg.exec(path);
		var propertyName = results[1];
		var rest = results[2];
		if (root[propertyName] && rest) {
			return this.jsonPath(root[propertyName], rest);
		} else if (root[propertyName]) {
			return root[propertyName];
		} else {
			return null;
		}
	},

	/**
	 * Returns a new node for the given path
	 *
	 * @param {String} path
	 * @param {Function} cbfstree
	 * @return void
	 */
	getNodeForPath: function (path, cbfstree) { // TODO
		var contentCollection = this.db.collection("content");
		var parts = path.split("/");
		contentCollection.findOne({_id:mongojs.ObjectId("structure")}, function(err, structure) {
			if (err) {
				throw err;
			}
			jsonPath(structure, path); // TODO
		});

		contentCollection.find()
		this.db.find().toArray(function(err, results) {

		});

		Fs.stat(realPath, function (err, stat) {

			if (!Util.empty(err))
				return cbfstree(new Exc.FileNotFound("File at location " + nicePath + " not found"));
			cbfstree(null, stat.isDirectory()
					? jsDAV_FS_Directory.new(realPath)
					: jsDAV_FS_File.new(realPath))
		});
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
