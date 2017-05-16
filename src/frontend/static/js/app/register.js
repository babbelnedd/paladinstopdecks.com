'use strict';

var $ = window.jQuery = window.$ = require('jquery');

$(function () {
    new FormValidator({
        input: $('.register-form input'),
        submit: $('#submit_registration')
    });
});

function FormValidator(opts) {
    var self = this;
    this.input = opts.input;
    this.submit = opts.submit;
    this.events = opts.events || 'change keyup paste';

    self.input.on('change keyup paste', /* @this HTMLElement */function () {
        self.validate.call(self, this); //eslint-disable-line no-useless-call
    });
}

FormValidator.prototype.validate = function validate(el) {
    var self = this;

    function update() {
        if (self.isValid()) {
            self.submit.prop('disabled', false);
            self.submit.removeClass('disabled');
        } else {
            self.submit.prop('disabled', true);
            self.submit.addClass('disabled');
        }
    }

    function setValid($el) {
        $el.removeClass('error');
        update();
    }

    function setInvalid($el) {
        $el.addClass('error');
        update();
    }

    var $el = $(el);
    var val = $el.val();
    var len = val.length;

    var type = $el.prop('type');
    var field = $el.data('field');

    var required = $el.data('required');
    var remote = $el.data('remote');
    var minLength = $el.data('minlength');
    var maxLength = $el.data('maxlength');
    var regex = $el.data('regex');

    var isRequired = required !== undefined;
    var hasRemote = remote !== undefined;
    var hasMinLength = minLength !== undefined;
    var hasMaxLength = maxLength !== undefined;
    var hasRegex = regex !== undefined;
    if (isRequired && !val) {
        return setInvalid($el);
    }
    if (hasMinLength && len < minLength) {
        return setInvalid($el);
    }
    if (hasMaxLength && len > maxLength) {
        return setInvalid($el);
    }
    if (hasRegex && new RegExp(regex).test(val) === false) {
        return setInvalid($el);
    }

    if (hasRemote) {
        var data = {};
        data[field] = val;
        $.ajax({
            method: 'GET',
            data: data,
            url: remote,
            success: function (res) {
                if (res === true) {
                    return setValid($el);
                }
                else {
                    return setInvalid($el);
                }
            },
            error: function () {
                return setInvalid($el);
            }
        });
    } else {
        setValid($el);
    }
};

FormValidator.prototype.isValid = function isValid() {
    var isValid = 0;

    for (var i = 0; i < this.input.length; i++) {
        if (!!$(this.input[i]).val() && $(this.input[i]).hasClass('error') === false) {
            isValid++;
        }
    }

    return isValid === this.input.length;
};