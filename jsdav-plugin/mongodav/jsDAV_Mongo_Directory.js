var jsDAV_Mongo_Node = require("./jsDAV_Mongo_Node");
var jsDAV_Mongo_File = require("./jsDAV_Mongo_File");
var jsDAV_Collection = require("./../../node_modules/jsDAV/lib/DAV/collection");
var jsDAV_iQuota = require("./../../node_modules/jsDAV/lib/DAV/interfaces/iQuota");
var iJsonRepresentation = require("./iJsonRepresentation");
var jsDAV_Mongo_Prop_Template = require("./jsDAV_Mongo_Prop_Template");
var mongojs = require("mongojs");
var Async = require("asyncjs");
var Exc = require("./../../node_modules/jsDAV/lib/shared/exceptions");
var mime = require("mime");
var Binary = require('bson').Binary;

//noinspection JSUnusedGlobalSymbols
var jsDAV_Mongo_Directory = module.exports = jsDAV_Mongo_Node.extend(iJsonRepresentation, jsDAV_Collection, jsDAV_iQuota, jsDAV_Mongo_Prop_Template, {
    initialize: function(path, pageDoc, tree) {
        this.setNew(pageDoc != null && pageDoc._id != null);
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
        var file = jsDAV_Mongo_File.new(this.createFilePath(name), null, this.tree);
        return file.writeData(data, enc, cbfscreatefile);
    },
	_createFile: function(name, data, enc, callback) {
		if (name.indexOf("/") != -1) {
			return callback(Exc.BadRequest("Name cannot contain '/'"));
		} else if (name.length == 0) {
			return callback(Exc.BadRequest("Name must not be empty"));
		}
		var mimeType = mime.lookup(name, "application/octet-stream");
		var resourceType = "attachment";
		if (mimeType.indexOf("image/") == 0) {
			resourceType = "image";
		} else if (mimeType.indexOf("text/markdown") == 0) {
			resourceType = "content";
		}
		var document = {
			"name": name,
			"size": data.length,
			"resourceType": resourceType,
			"path": this.pageDoc.path + "/" + name,
			"lastModified": new Date(),
			"created": new Date()
		};
		console.log("Creating file of mimeType " + mimeType + "(" + name + ")");
		console.log("Data is a " + (data instanceof Buffer ? "buffer" : "not buffer"));
		if (mimeType.indexOf("text/") != 0) {
			document.data = new Binary(data);
		} else {
			document.content = data.toString();
		}
		this.tree.mc.insert(document, function (err) {
			callback(err);
		});
	},

    createFilePath:   function (name) {
        return this.path == "/" ? this.path + name : this.path + "/" + name;
    }, /**
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
        var file = jsDAV_Mongo_File.new(this.createFilePath(name), null, this.tree);
        file.createFileStream(handler, enc, cbfscreatefile);
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
    "delete": function(cbfsfiledel) {
        this.tree.deletePath(this.pageDoc.path, cbfsfiledel);
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
    },
    getJson: function() {
        return this.pageDoc;
    }
});
