window.Element && function(ElementPrototype) {
	ElementPrototype.matches = ElementPrototype.matches ||
	ElementPrototype.mozMatchesSelector ||
	ElementPrototype.msMatchesSelector ||
	ElementPrototype.oMatchesSelector ||
	ElementPrototype.webkitMatchesSelector ||
	function (selector) {
		var node = this, nodes = (node.parentNode || node.document).querySelectorAll(selector), i = -1;
 
		while (nodes[++i] && nodes[i] != node);
 
		return !!nodes[i];
	}
}(Element.prototype);

window.Location && function(LocationPrototype) {
	LocationPrototype.getParameterValue = function(key) {
		if (!this["_parameters"]) {
			this.parseQueryString();
		}
		return this["_parameters"][key] != undefined ? this["_parameters"][key][0] : undefined;
	}
}(Location.prototype);

window.Location && function (LocationPrototype) {
	LocationPrototype.getParameterValues = function (key) {
		if (!this["_parameters"]) {
			this.parseQueryString();
		}
		return this["_parameters"][key] != undefined ? this["_parameters"][key] : [];
	}
}(Location.prototype);

window.Location && function(LocationPrototype) {
	LocationPrototype.parseQueryString = function() {
		this["_parameters"] = {};
		var re = /[\?&]([^&;=]+)=([^&;=]+)/g;
		var match;
		while ((match = re.exec(this.search)) != null) {
			var key = match[1];
			var value = match[2];
			if (!this["_parameters"][key]) {
				this["_parameters"][key] = [];
			}
			this["_parameters"][key].push(value);
		}

	}
}(Location.prototype);

function JsonFetch(url, successCallback, errorCallback) {
	var xhr = new XMLHttpRequest();
	xhr.addEventListener("load", function(evt) {
		var json;
		try {
			json = JSON.parse(this.responseText);
		} catch (e) {
			this._handleError(evt, e);
		}
		successCallback(json, this, evt);
	});
	xhr._handleError = function(evt, error) {
		if (errorCallback) {
			errorCallback(this.response, this, evt, error);
		} else {
			console.error("Error fetching JSON", error, this, evt)
		}
	};
	xhr.addEventListener("error", function(evt) {
		errorCallback(this.response, this, evt);
	});
	xhr.open("GET", url);
	xhr.setRequestHeader("Accept", "application/json");
	xhr.send();
}
