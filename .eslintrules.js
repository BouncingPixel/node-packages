module.exports = {
  "no-unused-vars": [
    "error",
    { "vars": "local", "args": "after-used", "argsIgnorePattern": "^_" }
  ],
  "require-yield": [
    "off"
  ],
  "indent": [
    "error",
    2,
    {"SwitchCase": 1}
  ],
  "quotes": [
    "error",
    "single"
  ],
  "semi": [
    "error",
    "always"
  ],
  "curly": [
    "error",
    "all"
  ],
  "no-sequences": [
    "error"
  ],
  "no-throw-literal": [
    "error"
  ],
  "no-shadow": [
    "error",
    { "builtinGlobals": true,  "allow": ['callback', 'err', 'root', 'event'] }
  ],
  "no-inner-declarations": [
    0
  ],
  "brace-style": [
    "error",
    "1tbs"
  ],
  "eqeqeq": [
    "error",
    "smart"
  ],
  "camelcase": [
    "error",
    {"properties": "never"}
  ],
  "comma-style": [
    "error",
    "last"
  ],
  "eol-last": [
    "warn",
  ],
  "key-spacing": [
    "error",
    { "beforeColon": false, "afterColon": true }
  ],
  "keyword-spacing": [
    "error",
    { "before": true, "after": true }
  ],
  "new-parens": [
    "error",
  ],
  "no-trailing-spaces": [
    "warn",
  ],
  "one-var": [
    "error",
    "never"
  ],
  "one-var-declaration-per-line": [
    "error",
    "always"
  ],
  "space-before-function-paren": [
    "error",
    "never"
  ],
  "space-infix-ops": [
    "error",
  ]
};
