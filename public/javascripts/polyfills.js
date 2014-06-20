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

Window && function(WindowPrototype) {
	WindowPrototype.getParameterValue = function(key) {
		if (!this["_parameters"]) {
			this.parseQueryString();
		}
		return this["_parameters"][key] != undefined ? this["_parameters"][key][0] : undefined;
	}
}(Window.prototype);

Window && function (WindowPrototype) {
	WindowPrototype.getParameterValues = function (key) {
		if (!this["_parameters"]) {
			this.parseQueryString();
		}
		return this["_parameters"][key] != undefined ? this["_parameters"][key] : [];
	}
}(Window.prototype);

Window && function(WindowPrototype) {
	WindowPrototype.parseQueryString = function() {
		this["_parameters"] = {};
		var re = /[\?&]([^&;=]+)=([^&;=]+)/g;
		var match;
		while ((match = re.exec(this.location.search)) != null) {
			var key = match[1];
			var value = match[2];
			if (!this["_parameters"][key]) {
				this["_parameters"][key] = [];
			}
			this["_parameters"][key].push(value);
		}

	}
}(Window.prototype);

function handleJsonError(evt, error, errorCallback) {
    if (errorCallback) {
        errorCallback(this.response, this, evt, error);
    } else {
        console.error("Error fetching JSON from " + url, error, this, evt)
    }
}

function JsonFetch(url, successCallback, errorCallback) {
	var xhr = new XMLHttpRequest();
	xhr.addEventListener("load", function(evt) {
		var json;
		try {
			json = JSON.parse(this.responseText);
		} catch (e) {
            handleJsonError(evt, e, errorCallback);
		}
		successCallback(json, this, evt);
	});
	xhr.addEventListener("error", function(evt) {
		errorCallback(this.response, this, evt);
	});
	xhr.open("GET", url);
	xhr.setRequestHeader("Accept", "application/json");
	xhr.send();
}

function HtmlFetch(url, targetEl, errorCallback) {
	var xhr = new XMLHttpRequest();
	xhr.addEventListener("load", function (evt) {
		var html;
		try {
			html = this.responseText;
		} catch (e) {
			handleJsonError(evt, e, errorCallback);
		}
		targetEl.innerHTML = html;
	});
	xhr.addEventListener("error", function (evt) {
		targetEl.innerHTML = "<span style=\"color: red\">Error fetching updated content</span>";
	});
	xhr.open("GET", url);
	xhr.setRequestHeader("Accept", "text/htmlfragment");
	xhr.send();
}

function JsonPost(url, data, successCallback, errorCallback) {
var xhr = new XMLHttpRequest();
    xhr.addEventListener("load", function(evt) {
        var json;
        try {
            json = JSON.parse(this.responseText);
        } catch (e) {
            handleJsonError(evt, e, errorCallback);
        }
        successCallback(json, this, evt);
    });
    xhr.addEventListener("error", function(evt) {
        errorCallback(this.response, this, evt);
    });
    xhr.open("POST", url);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(data));
}
