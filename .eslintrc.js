module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:json/recommended',
    'plugin:xwalk/recommended',
  ],
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
    // Raise the cell limit for blocks with more authorable fields than the
    // default of 4. article-header has 6 (eyebrow, eyebrowLink, title,
    // description, articleDate, hideReadTime); content-list has 7 (category,
    // pageSize, loadMoreLabel, loadMoreStyle, showDate, sortBy, maxItems).
    'xwalk/max-cells': ['error', { 'article-header': 6, 'content-list': 7 }],
  },
};
