var Util = require("./../../node_modules/jsDAV/lib/shared/util");
var jsDAV_ServerPlugin = require("./../../node_modules/jsDAV/lib/DAV/plugin");


var AsyncEventEmitter = require("./../../node_modules/jsDAV/lib/shared/asyncEvents").EventEmitter;
var Exc = require("./../../node_modules/jsDAV/lib/shared/exceptions");
//var Async = require("asyncjs");
var async = require("async");
var Path = require("../../util/posixPath");


var AuthorizationPlugin = module.exports = jsDAV_ServerPlugin.extend({
	/**
	 * Plugin name
	 *
	 * @var String
	 */
	name: "acl",

	/**
	 * Recursion constants
	 *
	 * This only checks the base node
	 */
	R_PARENT: 1,

	/**
	 * Recursion constants
	 *
	 * This checks every node in the tree
	 */
	R_RECURSIVE: 2,

	/**
	 * Recursion constants
	 *
	 * This checks every parentnode in the tree, but not leaf-nodes.
	 */
	R_RECURSIVEPARENTS: 3,

	/**
	 * Reference to server object.
	 *
	 * @var jsDAV_Handler
	 */
	handler: null,

	initialize: function (handler) {
		this.handler = handler;

//		handler.addEventListener("beforeGetProperties", this.beforeGetProperties.bind(this));
		handler.addEventListener("beforeMethod", this.beforeMethod.bind(this), AsyncEventEmitter.PRIO_HIGH);
		handler.addEventListener("beforeBind", this.beforeBind.bind(this), AsyncEventEmitter.PRIO_HIGH);
		handler.addEventListener("beforeUnbind", this.beforeUnbind.bind(this), AsyncEventEmitter.PRIO_HIGH);
//		handler.addEventListener("updateProperties", this.updateProperties.bind(this));
//		handler.addEventListener("beforeUnlock", this.beforeUnlock.bind(this), AsyncEventEmitter.PRIO_HIGH);
//		handler.addEventListener("report", this.report.bind(this));
//		handler.addEventListener("unknownMethod", this.unknownMethod.bind(this));
	},

	/**
	 * Returns the standard users' principal.
	 *
	 * This is one authorative principal url for the current user.
	 * This method will return null if the user wasn't logged in.
	 *
	 * @return string|null
	 */
	getCurrentUserPrincipal: function (callback) {
		var authPlugin = this.handler.plugins.auth;

		if (!authPlugin)
			return callback();
		/** @var authPlugin jsDAV_Auth_Plugin */

		var self = this;
		authPlugin.getCurrentUser(function (err, userName) {
			if (err)
				return callback(err);
			if (!userName)
				return callback();
			callback(null, self.defaultUsernamePath + "/" + userName);
		});
	},
	/**
	 * Triggered before any method is handled
	 *
	 * @param {String} method
	 * @param {String} uri
	 * @return void
	 */
	beforeMethod: function (e, method, uri) {
		var self = this;
		this.handler.getNodeForPath(uri, function (err, node) {
			// do not yield errors:
			// If the node doesn't exists, none of these checks apply
			if (err)
				return e.next();

			function cont(err) {
				e.next(err);
			}

			switch (method) {
				case "GET" :
				case "HEAD" :
				case "OPTIONS" :
					// For these 3 we only need to know if the node is readable.
					self.checkPrivileges(uri, "{DAV:}read", null, cont);
					break;
				case "PUT" :
				case "LOCK" :
				case "UNLOCK" :
					// This method requires the write-content priv if the node
					// already exists, and bind on the parent if the node is being
					// created.
					// The bind privilege is handled in the beforeBind event.
					self.checkPrivileges(uri, "{DAV:}write-content", null, cont);
					break;
				case "PROPPATCH" :
					self.checkPrivileges(uri, "{DAV:}write-properties", null, cont);
					break;
				case "ACL" :
					self.checkPrivileges(uri, "{DAV:}write-acl", null, cont);
					break;
				case "COPY" :
				case "MOVE" :
					// Copy requires read privileges on the entire source tree.
					// If the target exists write-content normally needs to be
					// checked, however, we're deleting the node beforehand and
					// creating a new one after, so this is handled by the
					// beforeUnbind event.
					//
					// The creation of the new node is handled by the beforeBind
					// event.
					//
					// If MOVE is used beforeUnbind will also be used to check if
					// the sourcenode can be deleted.
					self.checkPrivileges(uri, "{DAV:}read", self.R_RECURSIVE, cont);
					break;
				default:
					e.next();
					break;
			}
		});
	},

	/**
	 * Triggered before a new node is created.
	 *
	 * This allows us to check permissions for any operation that creates a
	 * new node, such as PUT, MKCOL, MKCALENDAR, LOCK, COPY and MOVE.
	 *
	 * @param {String} path
	 * @return void
	 */
	beforeBind: function (e, path) {
		var parentPath = path.length == 0 ? "/" : Path.dirname(path);
		this.checkPrivileges(parentPath, "{DAV:}bind", null, e.next.bind(e));
	},

	/**
	 * Triggered before a node is deleted
	 *
	 * This allows us to check permissions for any operation that will delete
	 * an existing node.
	 *
	 * @param {String} path
	 * @return void
	 */
	beforeUnbind: function (e, path) {
		var parentPath = path.length == 0 ? "/" : Path.dirname(path);
		this.checkPrivileges(parentPath, "{DAV:}unbind", this.R_RECURSIVEPARENTS, e.next.bind(e));
	},

	getSiteRoot: function(callback) {
		this.handler.getNodeForPath("/", callback);
	},

	getFolderForPath: function(path, callback) {
		var folderPath = path.length == 0 ? "/" : Path.dirname(path);
		return this.handler.getNodeForPath(folderPath, callback);
	},
	/**
	 * Checks if the current user has the specified privilege(s).
	 *
	 * You can specify a single privilege, or a list of privileges.
	 * This method will throw an exception if the privilege is not available
	 * and return true otherwise.
	 *
	 * @param {String} uri
	 * @param array|string privileges
	 * @param number recursion
	 * @throws jsDAV_Exception_NeedPrivileges
	 * @return bool
	 */
	checkPrivileges: function (uri, privileges, recursion, callback) {
		// TODO: Check recursion
		if (!Array.isArray(privileges))
			privileges = [privileges];

		recursion = recursion || this.R_PARENT;
		var self = this;

		async.parallel([
			this.getCurrentUserPrincipal.bind(this),
			this.getSiteRoot.bind(this),
			this.getFolderForPath.bind(this, uri)

		], function(err, results) {
			if (err) {
				return callback(err, false);
			}
			var currentUserName = results[0];
			var siteRoot = results[1].getJson();
			var folder = results[2].getJson();
			if (currentUserName == siteRoot.owner) { // Site owner always has access to do everything
				return callback(null, true);
			}
			var editors = folder["editors"];
			if (editors) { // Editors for this folder has access to do everything
				if (!Array.isArray(editors)) {
					editors = [editors];
				}
				for (var i = 0; i < editors.length; i++) {
					var editor = editors[i];
					if (editor == currentUserName) {
						return callback(null, true);
					}
				}
			}
			var viewers = folder["viewers"];
			if (viewers) {
				if (!Array.isArray(viewers)) {
					viewers = [viewers];
				}
				if (privileges.length == 1 && privileges[0] == "{DAV:}read") {
					for (var i = 0; i < viewers.length; i++) {
						var viewer = viewers[i];
						if (viewer == currentUserName) {
							return callback(null, true);
						}
					}
				}
			}
			if (privileges.length == 1 && privileges[0] == "{DAV:}read") {
				if (!folder.hidden) {
					return callback(null, true);
				}
			}

			return callback(new Exc.NeedPrivileges(uri, privileges), false);

		});

	}
});



