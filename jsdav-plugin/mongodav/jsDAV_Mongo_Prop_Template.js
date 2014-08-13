/*
 * @package jsDAV
 * @subpackage DAV
 * @copyright Copyright(c) 2011 Ajax.org B.V. <info AT ajax DOT org>
 * @author Mike de Boer <info AT mikedeboer DOT nl>
 * @license http://github.com/mikedeboer/jsDAV/blob/master/LICENSE MIT License
 */
"use strict";

var jsDAV_Property = require("./../../node_modules/jsDAV/lib/DAV/property");

var Exc = require("./../../node_modules/jsDAV/lib/shared/exceptions");
var guid = require("./jsDAV_Mongo_guid");

var jsDAV_Mongo_Prop_Template = module.exports = jsDAV_Property.extend({
    initialize: function(templateName) {
        this.templateName = templateName;
    },

    serialize: function(handler, lmDom) {
        // we need to add a namespace to the root node, so remove the last '>'
        lmDom = lmDom.substr(0, lmDom.lastIndexOf(">"));
        return lmDom + " xmlns:b=\"" + guid + "/\"" + " b:dt=\"string\">" + this.templateName;
    },

    /**
     * getTime
     *
     * @return {Date}
     */
    getTemplateName: function() {
        return this.templateName;
    }});
