'use strict';

module.exports = function(Model, options) {
  if (!options) {
    options = {};
  }

  return function(req, res) {
    let selectAll = false;

    let extraCols = req.query.extraColumns || [];
    if (options.extraCols) {
      if (options.extraCols === true) {
        selectAll = true;
      } else {
        extraCols = extraCols.concat(options.extraCols);
      }
    }
    extraCols = extraCols.map(c => {
      return {data: c};
    });

    const selects = extraCols.concat(req.query.columns).reduce((c, col) => {
      c[col.data] = 1;
      return c;
    }, {});

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
        query[col.data] = new RegExp(col.search.value, 'i');
      }
    });

    const extraFilter = req.query.extraFilter;
    if (options.allowExtraFilter && extraFilter) {
      for (let k in extraFilter) {
        // since this is passthrough, mongo query operators are available
        query[k] = extraFilter[k];
      }
    }
    if (options.extraQuery) {
      for (let k in options.extraQuery) {
        query[k] = options.extraQuery[k];
      }
    }

    const sorter = req.query.order.reduce((s, orderInfo) => {
      const col = req.query.columns[orderInfo.column];
      s[col.data] = orderInfo.dir.toLowerCase() === 'asc' ? 1 : -1;
      return s;
    }, {});

    const start = parseInt(req.query.start, 10) || 0;
    const length = parseInt(req.query.length, 10);

    const totalPromise = Model.count(baseQuery);
    const filteredTotal = Model.count(query);

    let filtered = Model.find(query);
    if (!selectAll) {
      filtered = filtered.select(selects);
    }
    filtered = filtered.sort(sorter).skip(start).limit(length).lean();

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
