'use strict';

export = function (schema:any) {
    let pathName = 'views';

    if (!schema.path(pathName)) {
        schema.add({
            views: {
                type: Number,
                required: false,
                'default': function () {
                    return 0;
                }
            }
        });
    }
};

