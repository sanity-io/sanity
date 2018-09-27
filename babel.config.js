/* eslint-disable import/no-commonjs */
module.exports = Object.assign({}, require('./.babelrc'), {
  babelrcRoots: ['.'].concat(require('./lerna.json').packages)
})
