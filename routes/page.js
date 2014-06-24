var jade = require('jade');
var md = require('marked');
var pathTool = require('path');

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
                        var content;
                        var htmlContent;
                        try {
                            content = persistence.getContentSync(page.content[prop]);
                            htmlContent = md(content);
                        } catch (e) {
                            console.error("Error getting content " + page.content[prop], e);
                            htmlContent = e + "";
                        }
                        htmlContents[prop] = {"id": page.content[prop], "html": htmlContent};
					}
					var templateFn = jade.compile(jadeStr, {
                        'filename': pathTool.join(persistence.getTemplatesPath(), page.template),
                        'pretty': true,
                        'basedir': __dirname + "/../views"}
                    );

                    var html;
                    try {
                        html = templateFn(htmlContents);
                    } catch (e) {
                        html = e + "";
                    }
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