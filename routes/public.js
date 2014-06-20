var md = require('marked');

exports.viewContent = function(persistence) {
    return function(req, res) {
        persistence.getContent(req.path, function(data) {
            var result = {
          			"id": req.path,
          			"content": data,
                    "md": md
          		};
            if (req.accepts("text/html")) {
          			res.render('layout', {contentBlocks: [result]});
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
        }, function(errorCode, error) {
            console.error(error);
            res.status(errorCode);
            res.end();
        });
    }
};