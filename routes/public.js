exports.viewContent = function(db) {
    return function(req, res) {
        res.render('content', {
            "id": 123,
            "content": "Jada, dette skulle egentlig være HTML generert utfra Markdown."
        });
    }
};