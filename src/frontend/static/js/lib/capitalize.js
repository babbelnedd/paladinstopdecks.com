module.exports = function (str) {

    str = str.toLowerCase();
    str = str.split(' ');

    for (var i = 0; i < str.length; i++) {
        str[i] = str[i].replace(str[i][0], str[i][0].toUpperCase());
    }

    return str.join(' ');

};