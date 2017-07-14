'use strict';

module.exports = function(tableName, options) {
  if (!options) {
    options = {};
  }

  return function(req, res) {
    const db = req.app.get('db');

    let selectAll = false;

    let extraCols = req.query.extraColumns || [];
    if (options.extraCols) {
      if (options.extraCols === true) {
        selectAll = true;
      } else {
        extraCols = extraCols.concat(options.extraCols);
      }
    }

    // why does this end up becoming one col of data? so weird
    const columns = req.query.columns.map(col => col.data).filter(c => !!c.length);
    const selects = columns.concat(extraCols.filter(c => columns.indexOf(c) === -1));

    const query = {};
    const baseQuery = {};
    if (options.baseQuery) {
      for (let k in options.baseQuery) {
        query[k] = options.baseQuery[k];
        baseQuery[k] = options.baseQuery[k];
      }
    }

    req.query.columns.forEach((col) => {
      if (col.search.value && col.search.value.length) {
        if (col.search.regex && col.search.regex.toString() === 'true') {
          query[`${col.data}::TEXT SIMILAR TO`] = `%${col.search.value}%`;
        } else {
          query[`${col.data}::TEXT ILIKE`] = `%${col.search.value}%`;
        }
      }
    });

    const extraFilter = req.query.extraFilter;
    if (options.allowExtraFilter && extraFilter) {
      for (let k in extraFilter) {
        // since this is passthrough, massive query operators are available
        query[k] = extraFilter[k];
      }
    }
    if (options.extraQuery) {
      for (let k in options.extraQuery) {
        query[k] = options.extraQuery[k];
      }
    }

    const sorter = req.query.order.map((orderInfo) => {
      const col = req.query.columns[orderInfo.column].data;
      const dir = orderInfo.dir.toLowerCase() === 'desc' ? ' DESC' : '';
      return [col, dir].join('');
    }).join(', ');

    const start = parseInt(req.query.start, 10) || 0;
    const length = parseInt(req.query.length, 10);

    const findOptions = {
      limit: length,
      offset: start,
      order: sorter
    };

    if (!selectAll) {
      findOptions.columns = selects;
    }

    const table = db[tableName];
    const totalPromise = table.count(baseQuery);
    const filteredTotal = table.count(query);
    const filtered = table.find(query, findOptions);

    Promise.all([totalPromise, filteredTotal, filtered]).then((results) => {
      const foundRecords = results[2];

      const ret = {
        draw: req.query.draw,
        recordsTotal: results[0],
        recordsFiltered: results[1],
        data: foundRecords
      };

      res.send(ret);
    }).catch((err) => {
      const ret = {
        draw: req.query.draw,
        error: err.message.toString()
      };
      res.status(err.status || 500);
      res.send(ret);
    });
  };
};
