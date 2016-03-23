'use strict'

const path = require('path')
const mocha = require('mocha')
const expect = require('chai').expect
const sinon = require('sinon')
const SanityPlugin = require('../src/SanityPlugin')

const it = mocha.it
const describe = mocha.describe

describe('SanityPlugin', () => {
  it('throws if basePath is not set', () => {
    expect(() => new SanityPlugin()).to.throw(/basePath/)
  })

  it('calls back immediately if not a style request', done => {
    (new SanityPlugin({basePath: '/sanity'})).apply(getCompiler({
      resolver: (thing, cb) => {
        const callback = sinon.spy()
        cb({request: 'component:foo/bar'}, callback)

        process.nextTick(() => {
          expect(callback).to.have.been.calledOnce
          done()
        })
      }
    }))
  })

  it('resolves to style loader if request is a style role', done => {
    (new SanityPlugin({basePath: '/sanity'})).apply(getCompiler({
      resolver: (thing, cb) => {
        cb({request: 'style:foo/bar', foo: 'bar'}, (err, req) => {
          expect(err).to.equal(null)
          expect(req.foo).to.equal('bar')
          expect(req.path).to.contain('/src/styleLoader.js?style=foo/bar')
          expect(req.resolved).to.equal(true)
          done()
        })
      }
    }))
  })

  it('skips non-style roles', done => {
    (new SanityPlugin({basePath: '/sanity'})).apply(getCompiler({
      plugin: (thing, cb) => cb({rawRequest: 'component:foo/bar'}, (err, req) => {
        expect(err).to.equal(null)
        expect(req.loaders).to.be.undefined
        done()
      })
    }))
  })

  it('adds style loaders in the right order for style roles', done => {
    (new SanityPlugin({basePath: '/sanity'})).apply(getCompiler({
      plugin: (thing, cb) => cb({rawRequest: 'style:foo/bar'}, (err, req) => {
        expect(err).to.equal(null)
        expect(req.loaders).to.eql([
          require.resolve('style-loader'),
          require.resolve('css-loader') + '?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]',
          require.resolve('postcss-loader'),
          require.resolve('../src/styleLoader') + '?style=foo/bar&basePath=/sanity'
        ])
        done()
      })
    }))
  })
})

function getCompiler(opts) {
  const noop = () => {}
  return {
    resolvers: {
      normal: {
        plugin: opts.resolver || noop
      }
    },
    plugin: (selector, register) => {
      register({
        plugin: opts.plugin || noop
      })
    }
  }
}
