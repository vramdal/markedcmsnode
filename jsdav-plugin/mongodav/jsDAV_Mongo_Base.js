var mongojs = require("mongojs");

var jsDAV_Mongo_Base =  module.exports = {

    setConnection: function(mongoConnection) {
        this.connection = mongoConnection;
    }

};