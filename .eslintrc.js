module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
  },
  // plugins: [
  //   'security',
  // ],
  extends: [
    // 'plugin:security/recommended',
    'eslint-config-airbnb-base/rules/best-practices.js',
    'eslint-config-airbnb-base/rules/errors.js',
    'eslint-config-airbnb-base/rules/es6.js',
    'eslint-config-airbnb-base/rules/imports.js',
    'eslint-config-airbnb-base/rules/node.js',
    'eslint-config-airbnb-base/rules/strict.js',
    'eslint-config-airbnb-base/rules/style.js',
    'eslint-config-airbnb-base/rules/variables.js',
  ],
  rules: {
    'no-console': 'off',
    'linebreak-style': 'off',
    'max-len': ['warn', { code: 175 }],
    'no-await-in-loop': 'off',
  },
};
