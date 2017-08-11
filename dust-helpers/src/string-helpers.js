var pluralize = require('pluralize');

module.exports = function(dust) {
  dust.helpers.pageDescription = function(chunk, context, bodies, params) {
    var desc = params.desc;
    var fallback = params.fallback;

    var value = desc;
    if (!value || !value.length) {
      value = fallback;
    }

    if (value && typeof value === 'string') {
      var valueLength = value.length;

      var length = parseInt(params.length, 10) || 155;
      var addElipsis = params.addElipsis || false;

      var pageDescription = value.substr(0, length);
      pageDescription = pageDescription.replace(/<\/?[a-z]+>/, '');

      chunk.write(pageDescription);

      if (addElipsis && valueLength > length) {
        chunk.write('...');
      }

      return chunk;
    }

    return chunk.write(value);
  };

  dust.helpers.substr = function(chunk, context, bodies, params) {
    var value = params.value;

    if (value && typeof value === 'string') {
      var valueLength = value.length;

      var start = parseInt(params.start, 10) || 0;
      var length = parseInt(params.length, 10);
      var addElipsis = params.addElipsis || false;

      if (addElipsis && start > 0) {
        chunk.write('...');
      }
      chunk.write(value.substr(start, length));
      if (addElipsis && valueLength > (length + start)) {
        chunk.write('...');
      }

      return chunk;
    }

    return chunk.write(value);
  };

  dust.helpers.wordlimit = function(chunk, context, bodies, params) {
    var value = params.value;
    var limit = parseInt(params.limit, 10);
    if (typeof value === 'string') {
      var splitString = value.split(' ');
      if (splitString.length <= limit) {
        return value;
      } else {
        return splitString.slice(0, limit).join(' ') + '...';
      }
    }
    return value;
  };

  //replaces \n char with <br> tag
  dust.helpers.nlToBr = function(chunk, context, bodies, params) {
    var shouldescape = (params.escape !== 'false');
    var value = shouldescape ? dust.filters.h(params.content) : params.content;
    if (typeof value === 'string') {
      value = value.replace(/\n/g, '<br>');
    }
    chunk.write(value);
    return chunk;
  };

  dust.helpers.expandableLessContent = function(chunk, context, bodies, params) {
    var shouldescape = (params.escape !== 'false');
    var maxLength = params.maxLength || 250;
    var value = shouldescape ? dust.filters.h(params.content) : params.content;

    if (typeof value === 'string') {
      if (value.length > maxLength) {
        var smallBody = value.substr(0, value.lastIndexOf(' ', maxLength));
        value = '<span class="lesscontent">' + smallBody + '... <a href="#" class="expandcontentlink">(more)</a></span>'
          + '<span class="morecontent hidden">' + value + ' <a href="#" class="shrinkcontentlink">(less)</a></span>';
      }

      value = value.replace(/\n/g, '<br>').replace(/\/n/g, '<br>');
    }
    chunk.write(value);
    return chunk;
  };

  dust.helpers.commaSep = function(chunk, context, bodies, params) {
    var value = parseInt(params.value, 10).toString();

    value = value.split('').reverse().join('');
    value = value.replace(/.{3}(?!$)/g, function(match) {
      return match + ',';
    });
    value = value.split('').reverse().join('');

    return value;
  };

  dust.helpers.pluralize = function(chunk, context, bodies, params) {
    var value = params.value;
    var count = parseInt(params.count, 10) || 0;

    var sub = params.sub;
    if (sub) {
      count = count - parseInt(sub, 10);
    }

    if (typeof value === 'string') {
      return pluralize(value, count);
    }
    return value;
  };

  dust.filters.allowEmTags = function(value) {
    if (typeof value === 'string') {
      return value.replace(/&lt;em\&gt;/gi, '<em>').replace(/&lt;\/em\&gt;/gi, '</em>');
    }

    return value;
  };

  dust.filters.capitalizeWords = function(value) {
    if (typeof value === 'string') {
      return value.split(' ').map(function(s){
        return s.charAt(0).toUpperCase() + s.slice(1);
      }).join(' ');
    }
    return value;
  };
};
