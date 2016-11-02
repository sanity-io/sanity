import {expect} from 'chai'
import {describe, it} from 'mocha'

describe('yarn', () => {
  it('returns the correct sanity version from the global CLI tool', () => {
    try {
      const lang = require('yarn/lib/reporters/lang/en')
      expect(lang).to.have.deep.property('default.optionalModuleScriptFail');
    } catch (err) {
      throw new Error('Can\'t find yarn language file at expected location')
    }
  })
})
