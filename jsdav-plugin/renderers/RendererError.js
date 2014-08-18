var Exc = require("./../../node_modules/jsDAV/lib/shared/exceptions");

exports.RendererError = function(msg, extra) {
    this.code    = 418;
    this.type    = "I'm a teapot";
    this.message = msg || this.type;
    this.extra = extra;
};
exports.RendererError.prototype = new Exc.jsDAV_Exception();
