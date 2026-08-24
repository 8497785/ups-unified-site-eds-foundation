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
    // default of 4. button has 5 (label, link, customClass, style, alignment);
    // article-header has 6 (eyebrow, eyebrowLink, title, description,
    // articleDate, hideReadTime); content-list has 8 (category, pageSize,
    // loadMoreLabel, loadMoreStyle, loadMoreAlignment, showDate, sortBy,
    // maxItems); related-articles has 7 (mode, category, articleCount, path1,
    // path2, path3, showDate); video has 6 (videoSource, link, externalUrl,
    // enablePlaceholderImage, image, imageAlt).
    'xwalk/max-cells': ['error', {
      button: 5, 'article-header': 6, 'content-list': 8, 'related-articles': 8, video: 6,
    }],
  },
};
