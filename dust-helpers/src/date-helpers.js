const moment = require('moment');

module.exports = function(dust) {
  dust.helpers.thisYear = function(_chunk, _context, _bodies, _params) {
    const today = new Date();
    return today.getFullYear();
  };

  dust.helpers.datepickerinit = function(_chunk, _context, _bodies, params) {
    const value = params.value;
    let time;

    if (value != null && (typeof value === 'string' || value instanceof Date)) {
      time = moment(value);
    } else {
      time = moment();
    }
    return time.format('MM/DD/YYYY');
  };

  dust.filters.timeago = function(value) {
    if (typeof value === 'string' || value instanceof Date) {
      const time = moment.utc(value);
      const now = moment();

      const diff = now.diff(time);

      if (diff < 60000) {
        return 'a few seconds ago';
      } else {
        return time.from(now);
      }
    }
    return value;
  };

  dust.filters.dateToISO = function(value) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  };

  dust.filters.fullDateTime = function(value) {
    if (typeof value === 'string' || value instanceof Date) {
      const time = moment.utc(value);
      return time.format('MMMM Do YYYY, h:mm a');
    }
    return value;
  };

  dust.filters.fullDate = function(value) {
    if (typeof value === 'string' || value instanceof Date) {
      const time = moment.utc(value);
      return time.format('MMMM Do YYYY');
    }
    return value;
  };

  dust.filters.fullDateComma = function(value) {
    if (typeof value === 'string' || value instanceof Date) {
      const time = moment.utc(value);
      return time.format('MMMM DD, YYYY');
    }
    return value;
  };

  dust.filters.usdate = function(value) {
    if (typeof value === 'string' || value instanceof Date) {
      const time = moment.utc(value);
      return time.format('MM/DD/YYYY');
    }
    return value;
  };
};
