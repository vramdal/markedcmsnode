exports.viewContent = function(persistence) {
    return function(req, res) {
        persistence.getContent(req.path, function(data) {
            var result = {
          			"id": req.path,
          			"content": data
          		};
            if (req.accepts("text/html")) {
          			res.render('content', result);
          		} else if (req.accepts("application/json")) {
          			res.json(result);
          		} else  {
          			res.status(406);
          		}
        }, function(errorCode, error) {
            res.status(errorCode);
            res.end();
            console.error(error);
        });
    }
};

exports.saveContent = function(persistence) {
    return function(req, res) {
        var data = req.body.content;
        persistence.saveContent(req.path, data, function(returnCode) {
            res.status(returnCode);
            if (returnCode == 201) {
                res.json("Created", req.path);
            } else {
                res.json("Saved", req.path);
            }
            res.end();
        }, function(errorCode, error) {
            console.error(error);
            res.status(errorCode);
            res.end();
        });
    }
};