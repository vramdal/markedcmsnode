
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.helloworld = function(req, res){
  res.render('helloworld', { title: 'Hello, World!' });
};

exports.userlist = function(db) {
    return function(req, res) {
        var collection = db.get('usercollection');
        collection.find({},{},function(e,docs){
/*
            res.render('userlist', {
                "userlist" : docs
            });
*/
            res.json(200, docs);
        });
    };
};

//noinspection JSUnusedLocalSymbols
function output(req, res) {
	return function(error, content) {
		if (error) {
			console.log("Feil", error);
		} else {
			res.json(200, content);
		}
	}
}

exports.content = function(db) {
	return function(req, res) {
		var collection = db.get("contentcollection");
		if (req.method == "GET") {
/*
		var handler = function (e, docs) {
			if (e) {
				console.log("Feil ved henting av content:", e);
			} else {
				res.json(200, docs);
			}
		};
*/
			collection.find({"_id": req.params[0]}, {}, output(req, res));
		} else if (req.method == "POST") {
			collection.insert(req.body, output(req, res));
		}
	}
};