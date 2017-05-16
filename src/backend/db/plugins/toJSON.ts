'use strict';


// todo: plugin löschen
export = function (schema:any) {
    schema.set('toJSON', {
        virtuals: true
    });
};