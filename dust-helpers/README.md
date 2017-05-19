# dust-helpers

Various dust helpers grouped by purpose

## Working With

### Requirements

- NodeJS 6 LTS
- DustJS from Linkedin 2.7.5+

### Using dust-helpers

Require in the desired helper(s) and initialize them with the dust instance.

```js
const dust = require('dustjs-linkedin');

const dateHelpers = require('@bouncingpixel/dust-helpers/date-helpers');
const stringHelpers = require('@bouncingpixel/dust-helpers/string-helpers');

dateHelpers(dust);
stringHelpers(dust);
```
