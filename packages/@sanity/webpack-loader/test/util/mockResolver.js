'use strict'

const qs = require('querystring')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const wrapResolver = props => {
  const fakeSanityResolver = function () { /* noop */ }
  for (const key in props) {
    if (props.hasOwnProperty(key)) {
      fakeSanityResolver[key] = props[key]
    }
  }
  return fakeSanityResolver
}

function getRoleLoader(roles) {
  return getLoader(roles, 'roleLoader')
}

function getStyleLoader(roles) {
  return getLoader(roles, 'styleLoader')
}

function getLoader(roles, loader) {
  return proxyquire(`../../src/${loader}`, {
    '@sanity/resolver': wrapResolver({
      resolveRoles: () => {
        return roles instanceof Error
          ? Promise.reject(roles)
          : Promise.resolve(roles)
      }
    })
  })
}

function getStyleContext(style, opts, callback) {
  const query = Object.assign({}, opts.query || {}, {
    basePath: '/sanity',
    style: style
  })

  return getContext(Object.assign({}, opts, {query}), callback)
}

function getContext(opts, callback) {
  return Object.assign({
    async: sinon.stub().returns(callback),
    cacheable: sinon.spy(),
    emitWarning: sinon.spy(),
    addDependency: sinon.spy()
  }, opts, {
    query: `?${qs.stringify(opts.query || {basePath: '/sanity'})}`
  })
}

module.exports = {
  getStyleContext,
  getContext,
  getStyleLoader,
  getRoleLoader,
  getLoader
}
