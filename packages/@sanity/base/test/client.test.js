import {describe, it} from 'mocha'
import {expect} from 'chai'
import client from '../src/client'

describe('client', () => {
  it('should be exposed in CommonJS format', done => {
    expect(client.fetch).to.be.a('function')
    done()
  })

  it('should still expose client on .default, but give warning', done => {
    expect(client.default.fetch).to.be.a('function')
    done()
  })
})
