'use strict'

const mocha = require('mocha')
const expect = require('chai').expect
const sinon = require('sinon')
const RoleResolverPlugin = require('../src/RoleResolverPlugin')

const it = mocha.it
const describe = mocha.describe

describe('RoleResolverPlugin', () => {
  it('throws if basePath is not set', () => {
    expect(() => new RoleResolverPlugin()).to.throw(/basePath/)
  })

  it('calls back immediately if not a sanity request', done => {
    const cb = sinon.spy()

    const plug = new RoleResolverPlugin({basePath: '/sanity'})
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
  const noop = () => {}
  return {
    plugin: (selector, resolve) => {
      resolve({
        request: opts.request || 'foo',
        query: opts.query || ''
      }, opts.callback || noop)
    }
  }
}
