/*
 * @package jsDAV
 * @subpackage DAV
 * @copyright Copyright(c) 2011 Ajax.org B.V. <info AT ajax DOT org>
 * @author Mike de Boer <info AT mikedeboer DOT nl>
 * @license http://github.com/mikedeboer/jsDAV/blob/master/LICENSE MIT License
 */
"use strict";

var jsDAV_Auth_AbstractBasic = require("../node_modules/jsDAV/lib/DAV/plugins/auth/abstractBasic");

var Exc = require("../node_modules/jsDAV/lib/shared/exceptions");
var Fs  = require("fs");

/**
 * List of users
 *
 * @var array
 */
var users = null;

var jsDAV_Auth_Backend_File = module.exports = jsDAV_Auth_AbstractBasic.extend({
    validateUserPass: function(username, password, cbvalidpass) {},
    authenticate: function(handler, realm, cbauth) {
        var req = handler.httpRequest;
        var res = handler.httpResponse;
        if (req.user) {
            this.currentUser = req.user.id;
        } else {
            this.currentUser = "anonymous";
        }
        cbauth(null, true);
    }
});
