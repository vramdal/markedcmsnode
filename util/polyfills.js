/* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith#Polyfill */
if (!String.prototype.endsWith) {
	Object.defineProperty(String.prototype, 'endsWith', {
		value: function (searchString, position) {
			var subjectString = this.toString();
			if (position === undefined || position > subjectString.length) {
				position = subjectString.length;
			}
			position -= searchString.length;
			var lastIndex = subjectString.indexOf(searchString, position);
			return lastIndex !== -1 && lastIndex === position;
		}
	});
}

/* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith#Polyfill */
if (!String.prototype.startsWith) {
	Object.defineProperty(String.prototype, 'startsWith', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (searchString, position) {
			position = position || 0;
			return this.indexOf(searchString, position) === position;
		}
	});
}

/* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/contains#Polyfill */
if (!String.prototype.contains) {
	String.prototype.contains = function () {
		return String.prototype.indexOf.apply(this, arguments) !== -1;
	};
}

/**
 * <p>Gets the substring after the first occurrence of a separator.
 * The separator is not returned.</p>
 *
 * <p>A <code>null</code> string input will return <code>null</code>.
 * An empty ("") string input will return the empty string.
 * A <code>null</code> separator will return the empty string if the
 * input string is not <code>null</code>.</p>
 *
 * <pre>
 * StringUtils.substringAfter(null, *)      = null
 * StringUtils.substringAfter("", *)        = ""
 * StringUtils.substringAfter(*, null)      = ""
 * StringUtils.substringAfter("abc", "a")   = "bc"
 * StringUtils.substringAfter("abcba", "b") = "cba"
 * StringUtils.substringAfter("abc", "c")   = ""
 * StringUtils.substringAfter("abc", "d")   = ""
 * StringUtils.substringAfter("abc", "")    = "abc"
 * </pre>
 *
 * @param str  the String to get a substring from, may be null
 * @param separator  the String to search for, may be null
 * @return the substring after the first occurrence of the separator,
 *  <code>null</code> if null String input
 * @since 2.0
 */
if (!String.prototype.substringAfter) {
	String.prototype.substringAfter = function(needle) {
		if (this.length == 0) {
			return this;
		}
		if (!needle) {
			return "";
		}
		var pos = this.indexOf(needle);
		if (pos == -1) {
			return "";
		}
		return this.substring(pos + needle.length);
	}
}