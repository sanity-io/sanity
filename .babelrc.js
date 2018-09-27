/* eslint-disable import/no-commonjs */
module.exports = {
  presets: [['@babel/env', require('./packages/@sanity/server/src/configs/babel-env-config')]],
  plugins: ['lodash', '@babel/plugin-proposal-class-properties'],
}
