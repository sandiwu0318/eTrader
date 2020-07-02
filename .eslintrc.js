module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es2020": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 11
    },
    "ignorePatterns": ["public/js/*.js"],
    "rules": {
        "no-var": "error",
        "semi": ["error", "always"],
        "quotes": ["error", "double"],
        "indent": ["error", 4],
        "linebreak-style": ["error", "unix"],
        "brace-style": [2, "1tbs", {"allowSingleLine": true}],
        "comma-spacing": [1, {"before": false, "after": true}]
    },
    "globals": {
        "process": "readonly"
    }
};
