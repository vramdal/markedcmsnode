var jsDAV_Mongo_Node = require("./jsDAV_Mongo_Node");
var jsDAV_Mongo_File = require("./jsDAV_Mongo_File");
var jsDAV_Collection = require("./../../node_modules/jsDAV/lib/DAV/collection");
var jsDAV_iQuota = require("./../../node_modules/jsDAV/lib/DAV/interfaces/iQuota");
var mongojs = require("mongojs");
var Async = require("asyncjs");
var Exc = require("./../../node_modules/jsDAV/lib/shared/exceptions");

var jsDAV_Mongo_Directory = module.exports = jsDAV_Mongo_Node.extend(jsDAV_Collection, jsDAV_iQuota, {
    initialize: function(path, pageDoc, tree) {
        this.path = path;
        this.pageDoc = pageDoc;
        this.tree = tree;
    },

    /**
     * Creates a new file in the directory
     *
     * data is a Buffer resource
     *
     * @param {String} name Name of the file
     * @param {Buffer} data Initial payload
     * @param {String} [enc]
     * @param {Function} cbfscreatefile
     * @return {*}
     */
    createFile: function(name, data, enc, cbfscreatefile) {
        if (name.indexOf("/") != -1) {
            return cbfscreatefile(Exc.BadRequest("Name cannot contain '/'"));
        } else if (name.length == 0) {
            return cbfscreatefile(Exc.BadRequest("Name must not be empty"));
        }
        return this.tree.mc.insert({
                    "name": name,
                    "content": data,
                    "pageId": this.pageDoc._id,
                    "enc": enc,
                    "size": data.length,
                    "resourceType": "content", // TODO - different filetypes will have different resource types
                    "created": new Date(),
                    "lastModified": new Date(),
                    "path": this.path + "/" + name
                },
                cbfscreatefile);
        /*
         var newPath = this.path + "/" + name;
         if (data.length === 0) {
         data = new Buffer(0);
         enc  = "binary";
         }
         Fs.writeFile(newPath, data, enc || "utf8", cbfscreatefile);
         */
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
    createFileStream: function(handler, name, enc, cbfscreatefile) {   // TODO
        // is it a chunked upload?
        var size = handler.httpRequest.headers["x-file-size"];
        var _this = this;
        if (size) {
            if (!handler.httpRequest.headers["x-file-name"])
                handler.httpRequest.headers["x-file-name"] = name;
            this.writeFileChunk(handler, enc, cbfscreatefile);
        }
        else {
            var newPath = this.path + "/" + name;
            handler.getRequestBody(enc, function(err, data) {
                if (err) {
                    cbfscreatefile(err);
                }
                _this.tree.mc.insert({
                            "name": name,
                            "content": data.toString(),
                            "pageId": _this.pageDoc._id,
                            "size": data.length
                        }, function(err) {
                    cbfscreatefile(err);
                });
            });

/*
            var stream = Fs.createWriteStream(newPath, {
                encoding: enc
            });
            handler.getRequestBody(enc, stream, false, cbfscreatefile);
*/
        }
    },

    writeFileChunk: function(handler, type, cbfswritechunk) { // TODO
        var size = handler.httpRequest.headers["x-file-size"];
        if (!size)
            return cbfswritechunk("Invalid chunked file upload, the X-File-Size header is required.");
        var self = this;
        var filename = handler.httpRequest.headers["x-file-name"];
        var path = this.path + "/" + filename;
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

        var stream = Fs.createWriteStream(path, {
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
    },

    /**
     * Creates a new subdirectory
     *
     * @param {String} name
     * @return void
     */
    createDirectory: function(name, cbfscreatedir) {
        if (name.indexOf("/") != -1) {
            return cbfscreatedir(Exc.BadRequest("Name cannot contain '/'"));
        } else if (name.length == 0) {
            return cbfscreatedir(Exc.BadRequest("Name must not be empty"));
        } else if (this.path == "/templates") {
            return cbfscreatedir(Exc.BadRequest("Cannot create subfolders under /templates"));
        }
        this.tree.mc.insert({
                    "_id": mongojs.ObjectId(),
                    "path": (this.path == "/" ? "" : this.path) + "/" + name,
                    "created": new Date(),
                    "title": name,
                    "resourceType": "page",
                    "lastModified": new Date()
                },
                function(err) {
                    cbfscreatedir(err);
                });
/*
        this.structureNode.pages.push({
            page: {
                // TODO: create id
                _id: mongojs.ObjectId("123"),
                pages: []
            }
        }, cbfscreatedir);
*/
        /*
         var newPath = this.path + "/" + name;
         Fs.mkdir(newPath, "0755", cbfscreatedir);
         */
    },

    /**
     * Returns a specific child node, referenced by its name
     *
     * @param {String} name
     * @throws Sabre_DAV_Exception_FileNotFound
     * @return Sabre_DAV_INode
     * @param cbfsgetchild
     */
    getChild: function(name, cbfsgetchild) {
        var path = this.path + "/" + name;
        return this.tree.getNodeForPath(path, cbfsgetchild);
/*
        Fs.stat(path, function(err, stat) {
            if (err || typeof stat == "undefined") {
                return cbfsgetchild(new Exc.FileNotFound("File with name "
                        + path + " could not be located"));
            }
            cbfsgetchild(null, stat.isDirectory()
                    ? jsDAV_FS_Directory.new(path)
                    : jsDAV_FS_File.new(path))
        });
*/
    },

    /**
     * Returns an array with all the child nodes
     *
     * @return Sabre_DAV_INode[]
     */
    getChildren: function(cbfsgetchildren) {
        return this.tree.getChildrenForNode(this.pageDoc, cbfsgetchildren);
/*
        Async.readdir(this.path)
                .stat()
                .each(function(file, cbnextdirch) {
                    nodes.push(file.stat.isDirectory()
                                    ? jsDAV_FS_Directory.new(file.path)
                                    : jsDAV_FS_File.new(file.path)
                    );
                    cbnextdirch();
                })
                .end(function() {
                    cbfsgetchildren(null, nodes);
                });
*/
    },

    /**
     * Deletes all files in this directory, and then itself
     *
     * @return void
     */
    "delete": function(cbfsdel) { // TODO
        cbfsdel("Not implemented");
    },

    /**
     * Returns available diskspace information
     *
     * @return array
     */
    getQuotaInfo: function(cbfsquota) {
        return cbfsquota(null, [0,0]);
/*
        if (!("statvfs" in Fs))
            return cbfsquota(null, [0, 0]);
        if (this.$statvfs) {
            return cbfsquota(null, [
                (this.$statvfs.blocks - this.$statvfs.bfree),// * this.$statvfs.bsize,
                this.$statvfs.bavail// * this.$statvfs.bsize
            ]);
        }
        Fs.statvfs(this.path, function(err, statvfs) {
            if (err || !statvfs)
                cbfsquota(err, [0, 0]);
            //_self.$statvfs = statvfs;
            cbfsquota(null, [
                (statvfs.blocks - statvfs.bfree),// * statvfs.bsize,
                statvfs.bavail// * statvfs.bsize
            ]);
        });
*/
    },
    getLastModified: function(cbfsgetlm) {
        return cbfsgetlm(null, this.pageDoc.lastModified);
    }
});
