var reg = /\/([^\/]+)(.*)/;
function jsonPath(root, path) {
	var results = reg.exec(path);
	var propertyName = results[1];
	var rest = results[2];
	if (root[propertyName] && rest) {
		return this.jsonPath(root[propertyName], rest);
	} else if (root[propertyName]) {
		return root[propertyName];
	} else {
		return null;
	}
}