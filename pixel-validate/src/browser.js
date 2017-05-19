/* eslint-env browser */

// export the validate method
// export a jquery plugin?

// jq plugin attaches to form on-submit
// if user defines their own on-submit before the plugin,
// they can pre-catch things and ignore if desired

const $ = require('jquery');
require('./jquery.serialize-object.js');

const mongooseDocument = require('mongoose').Document;

const validateFactories = require('./validate.js');
const validateAll = validateFactories.validateAllFactory(mongooseDocument);
const validateField = validateFactories.validateFieldFactory(mongooseDocument);

module.exports = {
  validate: validateAll,
  validateField: validateField
};

$.fn.pixelValidate = function(Schema, options) {
  return this.each(function(formIndex, formElement) {
    const form = $(formElement);

    function serializeForm() {
      let data = form.serializeObject();

      if (options && options.postSerialize) {
        const replaceddata = options.postSerialize(data);
        if (replaceddata != null) {
          data = replaceddata;
        }
      }

      return data;
    }

    $('[name],[data-validate-path]', form).not('button').on('change', function() {
      const field = $(this);

      const allData = serializeForm();

      const htmlPath = field.data('validatePath') || field.attr('name');
      const dotPath = htmlPathToDotPath(htmlPath);

      validateField(allData, dotPath, Schema).then(function() {
        field.removeClass('invalid').addClass('valid');
      }).catch(function(errorInfo) {
        const message = errorInfo.message;

        const skipValidation = field.data('skipValidation');
        const ignoreEmpty = field.data('ignoreEmpty');

        if (skipValidation) {
          return;
        }

        if (field.val() === '' && ignoreEmpty) {
          return;
        }

        field.addClass('invalid').removeClass('valid');
        field.siblings('label').attr('data-error', message);
      });
    });

    $('button[type="submit"]', form).on('click', function(evt, shouldIgnore) {
      if (shouldIgnore === 'ignore-validation') {
        return true;
      }

      evt.preventDefault();

      const button = $(this);

      const data = serializeForm();

      function handleFormResult(error) {
        const validationErrors = error && error.errors;

        if (error && !validationErrors) {
          // then show a global error message for the form
          return;
        }

        $('.invalid', form).removeClass('invalid').addClass('valid');

        let isValid = true;
        if (validationErrors) {
          isValid = Object.keys(validationErrors).filter((prop) => {
            const errorInfo = validationErrors[prop];

            const keypath = dotPathToHtmlPath(prop);

            const message = errorInfo.message;
            let field = $(`[name="${keypath}"]`, form);

            if (!field || !field.length) {
              const propparts = prop.split('.');
              const lastprop = propparts[propparts.length - 1];
              field = $(`#${lastprop}`);
            }

            const skipValidation = field.data('skipValidation');
            const ignoreEmpty = field.data('ignoreEmpty');

            if (skipValidation) {
              return false;
            }

            if (field.val() === '' && ignoreEmpty) {
              return false;
            }

            field.addClass('invalid').removeClass('valid');
            field.siblings('label').attr('data-error', message);
            return true;
          }).length === 0;
        }

        if (isValid) {
          // use button trigger to make sure to reclick the button the user did
          // important, because some buttons have [name="..."] and we want that to send
          button.trigger('click', ['ignore-validation']);
        } else {
          // focus and scroll to the issue
          const firstElement = $($('.invalid', form)[0]);

          const parentTab = firstElement.parents('.tabpanel');
          if (parentTab.length) {
            $('ul.tabs').tabs('select_tab', parentTab[0].id);
          }

          firstElement.focus();

          // const halfHeight = $(window).height() / 2;

          // const elementTop = firstElement.offset().top - halfHeight;
          // $('html, body').animate({ scrollTop: elementTop }, 500);
        }
      }

      validateAll(data, Schema).then(handleFormResult).catch(handleFormResult);
    });

  });

};

function dotPathToHtmlPath(dotPath) {
  const parts = dotPath.split('.');
  return parts[0] + parts.slice(1).map(part => `[${part}]`).join('');
}

function htmlPathToDotPath(htmlPath) {
  const parts = htmlPath.split(']['); // leaves the first 2 together and the last with an ending ]

  if (parts.length) {
    const index = parts[0].indexOf('[');
    if (index !== -1) {
      const first = parts[0].substring(0, index);
      const last = parts[0].substring(index + 1);

      parts[0] = first;
      parts.splice(1, 0, last);
    }
  }

  // even if there was just the first two stuck together
  // this will still remove the ending ] from the 2nd one since it was injected during the above
  if (parts.length > 1) {
    const lastIndex = parts.length - 1;
    const lastPartStrLength = parts[lastIndex].length;
    parts[lastIndex] = parts[lastIndex].substr(0, lastPartStrLength - 1);
  }

  return parts.join('.');
}
