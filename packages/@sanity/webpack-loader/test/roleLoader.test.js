'use strict'

const fs = require('fs')
const path = require('path')
const mocha = require('mocha')
const expect = require('chai').expect
const resolver = require('./util/mockResolver')

const it = mocha.it
const describe = mocha.describe
const getRoleLoader = resolver.getRoleLoader
const getContext = resolver.getContext

const defaultInput = fs.readFileSync(
  path.join(__dirname, '..', 'plugins.js'),
  {encoding: 'utf8'}
)

const invoke = (loader, context, input) => {
  loader.call(context, input || defaultInput)
}

describe('role loader', () => {
  it('serializes errors into a client-renderable JS blob', done => {
    const loader = getRoleLoader(new Error('foo'))
    const context = getContext({}, (err, result) => {
      expect(err).to.equal(null)
      expect(result).to.contain('Error: foo\\n')
      done()
    })

    invoke(loader, context)
  })

  it('calls back with error if basePath is not given', done => {
    invoke(getRoleLoader({}), getContext({query: {}}, (err, result) => {
      expect(err).to.not.equal(null)
      expect(err.message).to.equal('`basePath` property must be passed to role loader')
      done()
    }))
  })

  it('adds base sanity.json as dependency', done => {
    const loader = getRoleLoader({plugins: [], fulfilled: {}})
    const context = getContext({}, (what, result) => {
      expect(context.addDependency).to.have.been.calledWith('/sanity/sanity.json')
      done()
    })

    invoke(loader, context)
  })

  it('flags itself as cacheable', done => {
    const loader = getRoleLoader({plugins: [], fulfilled: {}})
    const context = getContext({}, (what, result) => {
      expect(context.cacheable).to.have.been.calledOnce
      done()
    })

    invoke(loader, context)
  })

  it('adds all plugin manifests as dependencies', done => {
    const paths = [
      '/sanity/plugins/foo',
      '/sanity/node_modules/sanity-plugin-bar',
      '/sanity/plugins/baz'
    ]

    const loader = getRoleLoader({
      fulfilled: {},
      plugins: paths.map(pluginPath => ({path: pluginPath}))
    })

    const context = getContext({}, (what, result) => {
      paths.forEach(pluginPath => {
        expect(context.addDependency).to.have.been.calledWith(
          path.join(pluginPath, 'sanity.json')
        )
      })

      done()
    })

    invoke(loader, context)
  })

  it('skips style roles = require(being included in the map', done => {
    const loader = getRoleLoader({
      plugins: [{path: '/sanity/node_modules/@sanity/default-layout'}],
      fulfilled: {
        'style:@sanity/default-layout/header': [{
          plugin: 'screaming-dev-badge',
          path: '/sanity/node_modules/sanity-plugin-screaming-dev-badge/css/scream.css'
        }]
      }
    })

    const context = getContext({}, (err, result) => {
      expect(err).to.not.be.ok
      expect(result).to.contain(' roles = {}')
      done()
    })

    invoke(loader, context)
  })

  it('creates a tree of resolved roles and adds a "dynamically generated"-banner', done => {
    const loader = getRoleLoader({
      plugins: [{path: '/sanity/node_modules/@sanity/default-layout'}],
      fulfilled: {
        'component:@sanity/default-layout/header': {
          plugin: '@sanity/default-layout',
          path: '/sanity/node_modules/@sanity/default-layout/src/Header.js'
        }
      }
    })

    const context = getContext({}, (err, result) => {
      expect(err).to.not.be.ok
      expect(result).to.not.contain(' roles = {}')
      expect(result).to.contain('require("/sanity/node_modules/@sanity/default-layout/src/Header.js")')
      expect(result).to.contain('dynamically built by the Sanity plugin')
      done()
    })

    invoke(loader, context)
  })
})
