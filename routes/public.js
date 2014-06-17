exports.viewContent = function(db) {
    return function(req, res) {
		var result = {
			"id": 123,
			"content": "Jada, dette skulle egentlig være HTML generert utfra Markdown."
		};
		if (req.accepts("text/html")) {
			res.render('content', result);
		} else if (req.accepts("application/json")) {
			res.json(result);
		} else  {
			res.status(406);
		}
    }
};