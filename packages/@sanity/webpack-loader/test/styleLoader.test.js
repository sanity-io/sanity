'use strict'

const fs = require('fs')
const path = require('path')
const mockFs = require('mock-fs')
const mocha = require('mocha')
const expect = require('chai').expect
const resolver = require('./util/mockResolver')

const it = mocha.it
const describe = mocha.describe
const getStyleLoader = resolver.getStyleLoader
const getStyleContext = resolver.getStyleContext
const getContext = resolver.getContext

const defaultInput = fs.readFileSync(
  path.join(__dirname, '..', 'plugins.js'),
  {encoding: 'utf8'}
)

const invoke = (loader, context, input) => {
  loader.call(context, input || defaultInput)
}

describe('style loader', () => {
  it('calls back with error if basePath is not given', done => {
    invoke(getStyleLoader({}), getContext({query: {}}, (err, result) => {
      expect(err).to.not.equal(null)
      expect(err.message).to.equal('`basePath` property must be passed to style loader')
      done()
    }))
  })

  it('calls back with error if style is not given', done => {
    invoke(getStyleLoader({}), getContext({query: {basePath: '/foo'}}, (err, result) => {
      expect(err).to.not.equal(null)
      expect(err.message).to.equal('`style` property must be passed to style loader')
      done()
    }))
  })

  it('adds base sanity.json as dependency', done => {
    const loader = getStyleLoader({plugins: [], fulfilled: {}})
    const context = getStyleContext('some/role', {}, (what, result) => {
      expect(context.addDependency).to.have.been.calledWith('/sanity/sanity.json')
      done()
    })

    invoke(loader, context)
  })

  it('flags itself as cacheable', done => {
    const loader = getStyleLoader({plugins: [], fulfilled: {}})
    const context = getStyleContext('some/role', {}, (what, result) => {
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

    const loader = getStyleLoader({
      fulfilled: {},
      plugins: paths.map(pluginPath => ({path: pluginPath}))
    })

    const context = getStyleContext('foo/bar', {}, (what, result) => {
      paths.forEach(pluginPath => {
        expect(context.addDependency).to.have.been.calledWith(
          path.join(pluginPath, 'sanity.json')
        )
      })

      done()
    })

    invoke(loader, context)
  })

  it('calls back with an error if no fulfillers are found for the role', done => {
    const loader = getStyleLoader({plugins: [], fulfilled: {}})
    const context = getStyleContext('foo/bar', {}, (err, result) => {
      expect(err).to.not.equal(null)
      expect(err.message).to.equal('No plugins have fulfilled the "style:foo/bar" role')
      done()
    })

    invoke(loader, context)
  })

  it('adds resolved CSS files as dependencies', done => {
    const role = '@sanity/default-layout/header'
    const fixture = getFixture()
    const context = getStyleContext(role, {}, (err, result) => {
      expect(err).to.equal(null)
      expect(result).to.be.ok

      fixture.roles.fulfilled[`style:${role}`].forEach(fulfiller => {
        expect(context.addDependency).to.have.been.calledWith(
          fulfiller.srcPath || fulfiller.path
        )
      })

      fixture.restore()
      done()
    })

    invoke(fixture.loader, context)
  })

  it('generates correct CSS for resolved role', done => {
    const role = '@sanity/default-layout/header'
    const fixture = getFixture()
    const context = getStyleContext(role, {}, (err, result) => {
      expect(err).to.equal(null)
      expect(result).to.be.ok

      expect(result).to.contain(`* Role: "style:${role}"`)
      expect(result).to.contain('/* Plugin: screaming-dev-badge */\n')
      expect(result.trim().split('\n').slice(-1)[0]).to.contain('.devBadge {')

      fixture.restore()
      done()
    })

    invoke(fixture.loader, context)
  })

  it('handles errors on invalid file reference', done => {
    const role = '@sanity/default-layout/header'
    const fixture = getFixture({missingFile: true})
    const context = getStyleContext(role, {}, (err, result) => {
      expect(err).to.be.ok
      expect(err.message).to.contain('ENOENT')
      fixture.restore()
      done()
    })

    invoke(fixture.loader, context)
  })

  it('handles errors on resolve failure', done => {
    const role = '@sanity/default-layout/header'
    const fixture = getFixture({roles: new Error('Resolver fail')})
    const context = getStyleContext(role, {}, (err, result) => {
      expect(err).to.be.ok
      expect(err.message).to.contain('Resolver fail')
      fixture.restore()
      done()
    })

    invoke(fixture.loader, context)
  })
})

function getFixture(opts) {
  const options = opts || {}
  const roles = options.roles || {
    fulfilled: {
      'style:@sanity/default-layout/header': [{
        plugin: 'screaming-dev-badge',
        path: '/sanity/plugins/screaming-dev-badge/css/scream.css'
      }, {
        plugin: 'material-design',
        srcPath: '/sanity/node_modules/sanity-plugin-material-design/css/header.css'
      }, {
        plugin: '@sanity/default-layout',
        path: '/sanity/node_modules/@sanity/default-layout/css/header.css'
      }]
    },
    plugins: [
      {path: '/sanity/node_modules/@sanity/default-layout'},
      {path: '/sanity/node_modules/sanity-plugin-material-design'},
      {path: '/sanity/plugins/screaming-dev-badge'}
    ]
  }

  const loader = getStyleLoader(roles)

  mockFs({
    '/sanity': {
      node_modules: { // eslint-disable-line camelcase
        '@sanity': {
          'default-layout': {
            css: {
              'header.css': '.header { background: red; }\n'
            }
          }
        },
        'sanity-plugin-material-design': {
          css: {
            'header.css': '.header { composes: header from "style:@sanity/default-layout/header"; color: #fff; }\n'
          }
        }
      },
      plugins: {
        'screaming-dev-badge': {
          css: options.missingFile ? {} : {
            'scream.css': '.devBadge { background: #ff00ff; color: #00ff00; }\n'
          }
        }
      }
    }
  })

  return {roles, loader, restore: mockFs.restore}
}
