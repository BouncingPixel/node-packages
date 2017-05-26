const states = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District Of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming'
};
// will be lazy loaded when needed
var stateToAbbr = null;

module.exports = function(dust) {
  dust.helpers.stateSelector = function(chunk, context, bodies, params) {
    const selectedState = params.selectedState || '';

    chunk.write('<select ');
    if (params.selectID) {
      chunk.write('id="');
      chunk.write(params.selectID);
      chunk.write('" ');
    }
    if (params.selectClass) {
      chunk.write('class="');
      chunk.write(params.selectClass);
      chunk.write('" ');
    }
    if (params.selectName) {
      chunk.write('name="');
      chunk.write(params.selectName);
      chunk.write('" ');
    }
    if (params.selectIsRequired) {
      chunk.write('required ');
    }
    chunk.write('>');

    if (params.showEmpty) {
      chunk.write('<option value=""');
      if (!selectedState || selectedState === '') {
        chunk.write(' selected');
      }
      chunk.write('>--</option>');
    }

    for (var state in states) {
      chunk.write('<option value="');
      chunk.write(state);
      chunk.write('"');
      if (selectedState === state) {
        chunk.write(' selected');
      }
      chunk.write('>');
      chunk.write(states[state]);
      chunk.write('</option>');
    }

    chunk.write('</select>');
    return chunk;
  };

  dust.filters.abbrToState = function(value) {
    if (typeof value === 'string') {
      return states[value];
    }

    return value;
  };

  dust.filters.stateToAbbr = function(value) {
    if (typeof value === 'string') {
      if (stateToAbbr === null) {
        stateToAbbr = {};
        for (var p in states) {
          stateToAbbr[states[p]] = p;
        }
      }

      return stateToAbbr[value];
    }

    return value;
  };
};
