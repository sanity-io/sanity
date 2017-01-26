import {describe, it} from 'mocha'
import {expect} from 'chai'
import reduceConfig from '../src/reduceConfig'

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

    it('sets api host in staging mode', () => {
      const reduced = reduceConfig({api: {dataset: 'hei'}}, 'production', true)

      expect(reduced.api.apiHost).to.include('.work')
      expect(reduced.api.dataset).to.equal('hei')
    })
  })
})
