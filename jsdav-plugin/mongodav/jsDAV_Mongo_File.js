var jsDAV_Mongo_Node = require("./jsDAV_Mongo_Node");
var jsDAV_File = require("./../../node_modules/jsDAV/lib/DAV/file");
//var jsDAV_iQuota = require("./../../node_modules/jsDAV/lib/DAV/interfaces/iQuota");
var mongojs = require("mongojs");
var iJsonRepresentation = require("./iJsonRepresentation");
var Async = require("asyncjs");
var Util = require("./../../node_modules/jsDAV/lib/shared/util");
var streamifier = require("streamifier");
var mime = require("mime");
var Binary = require('bson').Binary;


var jsDAV_Mongo_File = module.exports = jsDAV_Mongo_Node.extend(jsDAV_File, {
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
    put: function(data, type, cbfsput) {
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
        cbfsfileget(null, this.contentNode.content);
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
        end = end || this.size;
        cbfsfileget(null, this.contentDoc.data.read(start, end));
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
     * Delete the current file
     *
     * @return void
     */
    "delete": function(cbfsfiledel) {
        this.tree.deletePath(this.contentDoc.path, cbfsfiledel);
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
     * Returns the ETag for a file
     * An ETag is a unique identifier representing the current version of the file.
     * If the file changes, the ETag MUST change.
     * Return null if the ETag can not effectively be determined
     *
     * @return mixed
     */
    getETag: function(cbfsgetetag) {
        cbfsgetetag(null, null);
    },

    /**
     * Returns the mime-type for a file
     * If null is returned, we'll assume application/octet-stream
     *
     * @return mixed
     */
    getContentType: function(cbfsmime) {
        return cbfsmime(null, mime.lookup(this.contentDoc.path, "application/octet-stream"));
    },

    getLastModified: function(cbfsgetlm) {
        return cbfsgetlm(null, this.contentDoc.lastModified);
    },
    getJson: function() {
        return this.contentDoc;
    },
    writeData: function(data, enc, callback) {
   		var mimeType = mime.lookup(this.path, "application/octet-stream");
   		var resourceType = "attachment";
   		if (mimeType.indexOf("image/") == 0) {
   			resourceType = "image";
   		} else if (mimeType.indexOf("text/markdown") == 0) {
   			resourceType = "content";
   		} else if (mimeType.indexOf("text/jade") == 0 && this.path.indexOf("/templates/") == 0) {
            resourceType = "template";
        }

        var name = this.path.substring(this.path.lastIndexOf("/") + 1);

   		var document = {
   			"name": name,
   			"size": data.length,
   			"resourceType": resourceType,
   			"path": this.path,
   			"lastModified": new Date(),
   			"created": this.contentDoc && this.contentDoc.created ? this.contentDoc.created : new Date()
   		};
   		console.log("Creating file of mimeType " + mimeType + "(" + name + ")");
   		console.log("Data is a " + (data instanceof Buffer ? "buffer" : "not buffer"));
   		if (mimeType.indexOf("text/") != 0) {
   			document.data = new Binary(data);
   		} else {
   			document.content = data.toString();
   		}
        var _this = this;
        if (this.contentDoc && this.contentDoc._id) {
            _this.tree.mc.update(
                    {"_id": _this.contentDoc._id},
                    _this.contentDoc,
                    function (err) {
                        return callback(err);
                    });
        } else {
            this.tree.mc.insert(document, function (err) {
                _this.contentDoc = document;
                callback(err);
            });
        }
   	},
    /**
     * Creates a new file in the directory whilst writing to a stream instead of
     * from Buffer objects that reside in memory.
     *
     * @param {String} name Name of the file
     * @param resource data Initial payload
     * @param {String} [enc]
     * @param {Function} cbfscreatefile
     * @return void
     */
    createFileStream: function(handler,enc, cbfscreatefile) {   // TODO
        // is it a chunked upload?
        var size = handler.httpRequest.headers["x-file-size"];
        var name = this.path.substring(this.path.lastIndexOf("/") + 1);
        var _this = this;
        if (size) {
            if (!handler.httpRequest.headers["x-file-name"])
                handler.httpRequest.headers["x-file-name"] = name;
            this.writeFileChunk(handler, enc, cbfscreatefile);
        }
        else {
            handler.getRequestBody(enc, function(err, data) {
                if (err) {
                    return cbfscreatefile(err);
                }
				_this.writeData(data, enc, cbfscreatefile);
            });
        }
    },
    writeFileChunk: function(handler, type, cbfswritechunk) { // TODO
		throw new Error("Not implemented");
        var size = handler.httpRequest.headers["x-file-size"];
        if (!size)
            return cbfswritechunk("Invalid chunked file upload, the X-File-Size header is required.");
        var self = this;
        var filename = handler.httpRequest.headers["x-file-name"];
        var path = this.path;
        var track = handler.server.chunkedUploads[path];
        if (!track) {
            track = handler.server.chunkedUploads[path] = {
                path: handler.server.tmpDir + "/" + Util.uuid(),
                filename: filename,
                timeout: null
            };
        }
        clearTimeout(track.timeout);
        path = track.path;
        // if it takes more than ten minutes for the next chunk to
        // arrive, remove the temp file and consider this a failed upload.
        track.timeout = setTimeout(function() {
            delete handler.server.chunkedUploads[path];
            Fs.unlink(path, function() {});
        }, 600000); //10 minutes timeout

        var stream = Fs.createWriteStream(path, { // TODO
            encoding: type,
            flags: "a"
        });

        stream.on("close", function() {
            Fs.stat(path, function(err, stat) {
                if (err)
                    return;

                if (stat.size === parseInt(size, 10)) {
                    delete handler.server.chunkedUploads[path];
                    Util.move(path, self.path + "/" + filename, true, function(err) {
                        if (err)
                            return;
                        handler.dispatchEvent("afterBind", handler.httpRequest.url,
                                        self.path + "/" + filename);
                    });
                }
            });
        });

        handler.getRequestBody(type, stream, false, cbfswritechunk);
    }
});
