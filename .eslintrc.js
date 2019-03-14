module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: '6',
    sourceType: 'module',
    ecmaFeatures: {
      experimentalObjectRestSpread: true
    }
  },
  env : {
    node: true,
    es6: true
  },
  extends: [
    'eslint:recommended'
  ],
  rules: {
    'no-console': 'off',
    'object-curly-spacing': [2, 'always'],
  }
};
