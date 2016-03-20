/* eslint-env node */
'use strict' // eslint-disable-line strict

const path = require('path')
const loaderUtils = require('loader-utils')
const resolver = require('@sanity/resolver')
const serializeError = require('./serializeError')

module.exports = function getBaseLoader(loader) {
  return function sanityRoleLoader(input) {
    const callback = this.async()
    const query = loaderUtils.parseQuery(this.query)

    this.addDependency(path.join(query.basePath, 'sanity.json'))

    resolver
      .resolveRoles({basePath: query.basePath})
      .then(roles => {
        if (this.cacheable) {
          this.cacheable()
        }

        loader.call(this, {input, query, roles}, callback)
      })
      .catch(err => {
        this.emitWarning(err.message)
        callback(null, serializeError(err))
      })
  }
}
