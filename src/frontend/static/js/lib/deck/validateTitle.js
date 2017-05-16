module.exports = function validateTitle(title) {
    if (typeof title !== 'string') {
        return false;
    }
    if (/[^\x00-\x7F]/.test(title)) {
        return false;
    }
    if (title.length < 5) {
        return false;
    }
    if (title.length > 100) {
        return false;
    }

    return true;
};