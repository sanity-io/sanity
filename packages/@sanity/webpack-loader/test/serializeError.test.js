'use strict'

const path = require('path')
const mocha = require('mocha')
const expect = require('chai').expect
const serializeError = require('../src/serializeError')

const it = mocha.it
const describe = mocha.describe

describe('error serializer', () => {
  it('caches the resolved source code', done => {
    const err = new Error('foo')
    serializeError(err, (firstErr, firstRes) => {
      serializeError(err, (secondErr, secondRes) => {
        expect(firstErr).to.equal(null)
        expect(secondErr).to.equal(null)

        expect(firstRes).to.equal(secondRes)
        done()
      })
    })
  })

  it('includes the error message and stack', done => {
    const err = new Error('Foo? Bar!')
    serializeError(err, (resErr, res) => {
      expect(resErr).to.equal(null)
      expect(res).to.contain('Foo? Bar!')
      expect(res).to.contain(err.stack.split('\n', 2)[1].trim())
      done()
    })
  })
})
