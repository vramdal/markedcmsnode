var adminBootstrap = {
    start: function() {
        var head = document.querySelector("html > head");
        try {
            var adminCssEl = document.createElement("style");
            adminCssEl.setAttribute("type", "text/css");
            adminCssEl.appendChild(document.createTextNode("@import url('/public/stylesheets/view-admin.css');"));
            head.appendChild(adminCssEl);
        } catch (e) {
            console.error("Kunne ikke legge til admin-stylesheet", e);
        }
        var _this = this;
        window.addEventListener("load", function() {
            _this.discoverEditableElements();
        }, false);
    },
    setupEditableElement: function (editableElement) {
        var _this = this;
		editableElement.addEventListener("click", function(evt) {
			if (!evt.currentTarget["mdcms"]) {
				return;
			}
			if (evt.currentTarget.mdcms.isEditing()) {
				evt.currentTarget.mdcms.closeEditor();
			} else {
				evt.currentTarget.mdcms.startEditor();
			}
		}, true);
        editableElement["mdcms"] = {
            editFrame: undefined,
			element: editableElement,
			mdCmsContentId: editableElement.getAttribute("mdcms-content-id"),
            refreshFromServer: function() {
                new HtmlFetch(this.mdCmsContentId, this.element,
                        function(response, fetcher, evt) {
                            // TODO
                        });
            },
			startEditor: function () {
                if (this.isEditing()) {
                    return false;
                }
                var elementPosition = editableElement.getBoundingClientRect();
                editableElement.style.boxShadow = "0 0 5px 5px yellow";
//				window.addEventListener("message", this.receiveRefreshMessage.bind(this), false);
//                var editFrame = document.createElement("iframe");
                var editFrame = document.createElement("mdcms-markdown-editor");
                editFrame.addEventListener("refresh-preview", this.receiveRefreshMessage.bind(this), false);
                editFrame.setAttribute("class", "edit-frame");
                editFrame.setAttribute("frameborder", "0");
                editFrame.setAttribute("mdCmsContentId", this.mdCmsContentId);
				editFrame.setAttribute("src", "/editor-demo.html?mdcms-content-id=" + this.mdCmsContentId);
                var self = this;
                editFrame.addEventListener("close", function() {
                    self.closeEditor();
                });
//                editFrame.style.width = Math.max(500, elementPosition.width) + "px";
//                editFrame.style.height = Math.max(200, elementPosition.height) + "px";
//                editFrame.style.top = elementPosition.bottom + "px";
//                editFrame.style.left = elementPosition.left + "px";
                document.body.appendChild(editFrame);
                editFrame.focus();
                this.editFrame = editFrame;
            },
            closeEditor: function () {
                if (!this.isEditing()) {
                    return false;
                }
                editableElement.style.boxShadow = "";
                document.body.removeChild(this.editFrame);
                this.editFrame.removeEventListener("refresh-preview", this.receiveRefreshMessage, false);
                window.document.title = window.document.title + "...";
                var _this = this;
                var url = this.mdCmsContentId;
                new FormPost(url, this.editFrame.value,
                        function(text, fetcher, evt) {
                            window.document.title = window.document.title.substring(0, window.document.title.length - 3);
                            _this.refreshFromServer();
                        },
                        function(response, fetcher, evt) {
                            _this.refreshFromServer();
                            window.document.title = window.document.title.substring(0, window.document.title.length - 3);
                            console.error("Feil ved lagring", response, fetcher, evt);
                });
                this.editFrame = undefined;
                window.removeEventListener("message", this.receiveRefreshMessage, false);
			},
			receiveRefreshMessage: function(evt) {
/*
				if (evt.origin !== window.location.protocol + "//" + window.location.host) {
					console.error("Bad origin", evt.origin);
				}
*/
				if (evt.detail["mdcms-content-id"] == this.mdCmsContentId) {
					this.element.innerHTML = evt.detail["html"];
				}
			},
            isEditing: function () {
                return this.editFrame != undefined;
            }
        }
    }, discoverEditableElements: function() {
        var editableElements = Array.prototype.slice.call(document.querySelectorAll(".mdcms-content"));
        for (var i = 0; i < editableElements.length; i++) {
            var editableElement = editableElements[i];
            if (!editableElement["mdcms"]) {
                this.setupEditableElement(editableElement);
            }
        }
    }
};

adminBootstrap.start();