var md = require('marked');

exports.viewContent = function (persistence) {
	return function (req, res) {
		persistence.getPage(req.path, function (data) {
			if (req.accepts("text/html")) {
				res.render('page', {md: md});
			} else {
				res.status(406);
			}
		}, function (errorCode, error) {
			res.status(errorCode);
			res.end("Error " + errorCode);
			console.error(error);
		});
	}
};