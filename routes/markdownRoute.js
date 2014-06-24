var md = require('marked');
var pathTool = require('path');
var jade = require('jade');

exports.preview = function (persistence) {
	return function (req, res, next) {

		persistence.getContent(req.path, function (content) {
            var html = jade.renderFile(
                    pathTool.join(__dirname, "/../views/includes/content.jade"),
                    {
                        contentBlock: {html: md(content), id: req.path},
                        'pretty': true,
                        'basedir': __dirname + "/../views"
                    }
            );
//            var html = templateFn(content);

            res.end(html);
		}, function(errorCode, error) {
            next(errorCode, error);
//            res.writeHead(errorCode);
//            res.end(error);
        });
	}
};