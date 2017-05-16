'use strict';

/**
 * un-escape special characters in the given string of html.
 *
 * @param  {String} html
 * @return {String}
 */

export = {
    html: function (html:string) {
        return String(html)
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, '\'')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&');
    }
};