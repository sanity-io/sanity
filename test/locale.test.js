import {describe, it} from 'mocha'
import {assert} from 'chai'
import locale from '../src/locale'
import languageResolver from '../src/locale/languageResolver'


describe('locale', () => {

  it('exposes the correct stuff', done => {
    assert.equal(typeof locale.FormattedMessage, 'function')
    assert.equal(typeof locale.FormattedDate, 'function')
    done()
  })

})


describe('languageResolver', () => {

  it('has a sane default', done => {
    languageResolver.should.eventually.equal('en-US').notify(done)
  })

})
