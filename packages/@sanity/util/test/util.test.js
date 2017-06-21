import path from 'path'
import {describe, it} from 'mocha'
import {expect} from 'chai'
import {reduceConfig, getSanityVersions} from '../src'

describe('util', () => {
  describe('reduceConfig', () => {
    it('merges env config', () => {
      const reduced = reduceConfig({
        foo: 'bar',
        nested: {structure: true, onlyInOriginal: 'yes'},
        env: {
          production: {
            foo: 'baz',
            nested: {
              structure: false,
              otherProp: 'yup'
            }
          }
        }
      }, 'production')

      expect(reduced.foo).to.equal('baz')
      expect(reduced.nested.structure).to.equal(false)
      expect(reduced.nested.onlyInOriginal).to.equal('yes')
      expect(reduced.nested.otherProp).to.equal('yup')
      expect(reduced.env).to.be.an('undefined')
    })

    it('does not crash if there is no env config specified', () => {
      const reduced = reduceConfig({
        foo: 'bar',
        nested: {structure: true, onlyInOriginal: 'yes'}
      }, 'production')

      expect(reduced.foo).to.equal('bar')
      expect(reduced.nested.structure).to.equal(true)
      expect(reduced.nested.onlyInOriginal).to.equal('yes')
    })

    it('concats arrays', () => {
      const reduced = reduceConfig({
        root: true,
        plugins: ['@sanity/base', '@sanity/components'],
        env: {development: {plugins: ['vision']}}
      }, 'development')

      expect(reduced.root, true)
      expect(reduced.plugins).to.deep.equal(['@sanity/base', '@sanity/components', 'vision'])
    })
  })

  describe('getSanityVersions', () => {
    it('extracts correct versions', () => {
      const versions = getSanityVersions(path.join(__dirname, 'versionsFixture'))
      expect(versions).to.deep.equal({
        '@sanity/base': '0.999.99',
        '@sanity/components': '0.777.77'
      })
    })
  })
})
