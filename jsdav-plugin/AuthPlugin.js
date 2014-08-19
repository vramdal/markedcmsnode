/*
 * @package jsDAV
 * @subpackage DAV
 * @copyright Copyright(c) 2011 Ajax.org B.V. <info AT ajax DOT org>
 * @author Mike de Boer <info AT mikedeboer DOT nl>
 * @license http://github.com/mikedeboer/jsDAV/blob/master/LICENSE MIT License
 */
"use strict";

//var jsDAV_Auth_AbstractBasic = require("../node_modules/jsDAV/lib/DAV/plugins/auth/abstractBasic");
var jsDAV_Auth_iBackend = require("../node_modules/jsDAV/lib/DAV/plugins/auth/iBackend");

var Exc = require("../node_modules/jsDAV/lib/shared/exceptions");
var Fs  = require("fs");

/**
 * List of users
 *
 * @var array
 */
var users = null;

var jsDAV_Auth_Backend_MarkedCMS = module.exports = jsDAV_Auth_iBackend.extend({

    initialize: function(userCollection) {
        this.userCollection = userCollection;
    },
    authenticate: function(handler, realm, cbauth) {
        var req = handler.httpRequest;
        var res = handler.httpResponse;
        var _this = this;
        if (req.user) {
            this.userCollection.findOne({"email": req.user.id}, function(err, userDoc) {
                if (userDoc) {
                    _this.currentUser = userDoc.email;
                    return cbauth(null, true);
                }
                handler.handleError(new Exc.jsDAV_Exception(
                    "User " + req.user.id + " is not recognized at this site"));
                req.logout(); // Passport
                return cbauth(null, false);
            });
        } else {
            this.currentUser = "anonymous";
            cbauth(null, true);
        }
    },

    getCurrentUser: function(cbgetuser) {
        cbgetuser(null, this.currentUser);
    }
});
