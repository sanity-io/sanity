'use strict'

const mocha = require('mocha')
const expect = require('chai').expect
const sinon = require('sinon')
const PartResolverPlugin = require('../src/PartResolverPlugin')

const it = mocha.it
const describe = mocha.describe

describe('PartResolverPlugin', () => {
  it('throws if basePath is not set', () => {
    expect(() => new PartResolverPlugin()).to.throw(/basePath/)
  })

  it('calls back immediately if not a sanity request', done => {
    const cb = sinon.spy()

    const plug = new PartResolverPlugin({basePath: '/sanity'})
    plug.apply(getResolver({
      request: 'foo',
      callback: cb
    }))

    process.nextTick(() => {
      expect(cb).to.have.been.calledOnce
      done()
    })
  })
})

function getResolver(opts) {
  const noop = () => {} // eslint-disable-line no-empty-function
  return {
    plugin: (selector, resolve) => {
      resolve({
        request: opts.request || 'foo',
        query: opts.query || ''
      }, opts.callback || noop)
    }
  }
}
