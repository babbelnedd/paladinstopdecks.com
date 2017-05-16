module.exports = function concat(results) {
    var _results = [];
    for (var i = 0; i < results.length; i++) {
        _results = _results.concat(results[i]);
    }
    return _results;
};