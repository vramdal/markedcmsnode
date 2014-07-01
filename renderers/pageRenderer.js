module.exports = function(resourceResolver) {
    return function(resource, response) {
        resource.getJSON(function(json) {
            response.json(json);
            // TODO: Sett sammen side
        });
    }
};