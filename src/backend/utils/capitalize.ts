'use strict';

function capitalize(str:string) {
    return str.toLowerCase().charAt(0).toUpperCase() + str.slice(1);
}

export = capitalize;