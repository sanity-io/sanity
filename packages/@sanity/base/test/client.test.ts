// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import esmClient from '../src/client/index.esm'

describe('require client instance (cjs)', () => {
  const cjsClient = require('../src/client')

  it('should be a client instance exported as a CommonJS module', () => {
    expect(typeof cjsClient).toBe('object')
    expect(cjsClient.hasOwnProperty('default')).toBe(false)
    expect(cjsClient.hasOwnProperty('withConfig')).toBe(true)
  })
})

describe('import client instance (esm)', () => {
  it('should be a client instance exported as a CommonJS module', () => {
    expect(typeof esmClient).toBe('object')
    expect(esmClient.hasOwnProperty('default')).toBe(false)
    expect(esmClient.hasOwnProperty('withConfig')).toBe(true)
  })
})
