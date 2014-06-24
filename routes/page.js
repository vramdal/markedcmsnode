var md = require('marked');
var jade = require('jade');

exports.viewContent = function (persistence) {
	return function (req, res) {

		var errorHandler = function(errorCode, error) {
			console.error(error);
			res.status(errorCode);
			res.end("Error " + errorCode);
		};

		persistence.getPage(req.path, function (page) {
			if (req.accepts("text/html")) {
				persistence.getTemplate(page.template, function(jadeStr) {
					var htmlContents = {};
					for (var prop in page.content) {
						if (!page.content.hasOwnProperty(prop)) {
							continue;
						}
						var content = persistence.getContentSync(page.content[prop]);
						htmlContents[prop] = {"id": page.content[prop], "html": md(content)};
					}
					var templateFn = jade.compile(jadeStr, {'filename': page.template, 'pretty': true});

					var html = templateFn(htmlContents);
					res.end(html);
				}, errorHandler);
//				res.render('page', {md: md});
			} else {
				res.status(406);
				res.end("Error 406");
			}
		}, errorHandler);
	}
};