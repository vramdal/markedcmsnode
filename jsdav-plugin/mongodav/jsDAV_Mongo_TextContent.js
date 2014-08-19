var jsDAV_Mongo_Node = require("./jsDAV_Mongo_Node");
var jsDAV_File = require("./../../node_modules/jsDAV/lib/DAV/file");
//var jsDAV_iQuota = require("./../../node_modules/jsDAV/lib/DAV/interfaces/iQuota");
var mongojs = require("mongojs");
var iJsonRepresentation = require("./iJsonRepresentation");
var jsDAV_Mongo_File = require("./jsDAV_Mongo_File");
var Async = require("asyncjs");
var Util = require("./../../node_modules/jsDAV/lib/shared/util");
var streamifier = require("streamifier");
var mime = require("mime");

var jsDAV_Mongo_TextContent = module.exports = jsDAV_Mongo_File.extend(iJsonRepresentation, {
    initialize: function(path, contentDoc, tree) {
        this.setNew(contentDoc != null && contentDoc._id != null);
        this.path = path;
        this.contentDoc = contentDoc;
        this.tree = tree;
    },

    /**
     * Updates the data
     *
     * @param {mixed} data
     * @return void
     */
    put: function(data, type, cbfsput) { // TODO
        handler.markDirty(_this.path);
        Fs.writeFile(this.path, data, type || "utf8", cbfsput);
    },

    /**
     * Updates the data whilst writing to a stream instead of from Buffer objects
     * that reside in memory.
     *
     * @param {mixed} data
     * @return void
     */
    putStream: function(handler, type, cbfsput) {
        var path = this.path;
        // is it a chunked upload?
        var _this = this;
        var size = handler.httpRequest.headers["x-file-size"];
        if (size) {
            var parts = Util.splitPath(this.path);
            if (!handler.httpRequest.headers["x-file-name"])
                handler.httpRequest.headers["x-file-name"] = parts[1];
            handler.getNodeForPath(parts[0], function(err, parent) {
                if (!Util.empty(err))
                    return cbfsput(err);

                parent.writeFileChunk(handler, type, cbfsput);
            });
        }
        else {
//            handler.getRequestBody(type, stream, false, cbfsput);
            return handler.getRequestBody(type, function(err, data) {
                _this.contentDoc.content = data.toString("utf8");
                _this.contentDoc.lastModified = new Date();
                _this.contentDoc.enc = type;
                _this.contentDoc.size = data.length;



                _this.tree.mc.update(
                        {"_id": _this.contentDoc._id},
                        _this.contentDoc,
                        function (err) {
                            handler.markDirty(_this.path);
                            return cbfsput(err);
                        });
            });
        }
    },

    /**
     * Returns the data
     *
     * @return Buffer
     */
    get: function(cbfsfileget) {
        cbfsfileget(null, this.contentDoc.content);
/*
        if (this.$buffer)
            return cbfsfileget(null, this.$buffer);
        //var _self  = this;
        var onRead = function(err, buff) {
            if (err)
                return cbfsfileget(err);
            // For older versions of node convert the string to a buffer.
            if (typeof buff === "string") {
                var b = new Buffer(buff.length);
                b.write(buff, "binary");
                buff = b;
            }
            // Zero length buffers act funny, use a string
            if (buff.length === 0)
                buff = "";
            //_self.$buffer = buff;
            cbfsfileget(null, buff);
        };

        // Node before 0.1.95 doesn't do buffers for fs.readFile
        if (process.version < "0.1.95" && process.version > "0.1.100") {
            // sys.debug("Warning: Old node version has slower static file loading");
            Fs.readFile(this.path, "binary", onRead);
        }
        else {
            Fs.readFile(this.path, onRead);
        }
*/
    },

    /**
     * Returns the data whilst using a ReadStream so that excessive memory usage
     * is prevented.
     *
     * @return Buffer
     */
    getStream: function(start, end, cbfsfileget) {
        start = start || 0;
        end = end || this.contentDoc.content.length;
        cbfsfileget(null, this.contentDoc.content.substring(start, end));
        cbfsfileget(); // Need to make a no-argument call to cbfsfileget to make it response.end(). See trunk/node/nodetest1/node_modules/jsDAV/lib/DAV/handler.js#611
/*        if (typeof start == "number" && typeof end == "number")
            options = { start: start, end: end };
        var stream = Fs.createReadStream(this.path, options);

        stream.on("data", function(data) {
            cbfsfileget(null, data);
        });

        stream.on("error", function(err) {
            cbfsfileget(err);
        });

        stream.on("end", function() {
            // Invoking the callback without error and data means that the callee
            // can continue handling the request.
            cbfsfileget();
        });*/
    },

    /**
     * Returns the size of the node, in bytes
     *
     * @return int
     */
    getSize: function(cbfsgetsize) {
        cbfsgetsize(null, this.contentDoc.size);
/*
        if (this.$stat)
            return cbfsgetsize(null, this.$stat.size);
        var self = this;
        return Fs.stat(this.path, function(err, stat) {
            if (err || !stat) {
                return cbfsgetsize(new Exc.FileNotFound("File at location "
                    + self.path + " not found"));
            }
            //_self.$stat = stat;
            cbfsgetsize(null, stat.size);
        });
*/
    },

    /**
     * Returns the mime-type for a file
     * If null is returned, we'll assume application/octet-stream
     *
     * @return mixed
     */
    getContentType: function(cbfsmime) {
        return cbfsmime(null, mime.lookup(this.path));
    },

    getJson: function() {
        return this.contentDoc;
    }
});
