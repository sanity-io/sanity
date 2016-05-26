import {describe, it} from 'mocha'
import {assert} from 'chai'
import languageResolver from '../src/locale/languageResolver'
import proxyquire from 'proxyquire'
proxyquire.noCallThru()

const rawMessagesStub = [
  {
    'en-US': {
      'foo.hello': 'Heya',
      'foo.goodbye': 'Baya'
    }
  },
  {
    'en-US': {
      'foo.goodbye': 'Goodbye'
    }
  },
  {
    'nb-NO': {
      'foo.hello': 'Heisann'
    }
  },
  {
    'nb-NO': {
      'foo.goodbye': 'Baya'
    }
  }
]

const messagesFetcher = proxyquire('../src/locale/messagesFetcher', {
  'all:locale:@sanity/base/locale-messages': rawMessagesStub
})


describe('languageResolver', () => {

  it('has a sane default', done => {
    languageResolver.should.eventually.equal('en-US').notify(done)
  })

})


describe('messagesFetcher', () => {

  it('fetches localized messages', done => {
    const expected = {
      'foo.hello': 'Heya',
      'foo.goodbye': 'Goodbye'
    }
    messagesFetcher.fetchLocalizedMessages('en-US').should.eventually.deep.equal(expected).notify(done)
  })

  it('fetches all messages', done => {
    const expected = {
      'en-US': {
        'foo.goodbye': 'Goodbye',
        'foo.hello': 'Heya'
      },
      'nb-NO': {
        'foo.goodbye': 'Baya',
        'foo.hello': 'Heisann'
      }
    }
    messagesFetcher.fetchAllMessages().should.eventually.deep.equal(expected).notify(done)
  })

})


describe('locale', () => {

  it('exposes the correct stuff', done => {
    const SanityIntlPromise = require('../src/locale')
    SanityIntlPromise.then(result => {
      assert.equal(typeof result.ReactIntl.FormattedMessage, 'function')
      assert.equal(typeof result.SanityIntlProvider, 'function')
      done()
    })
  })

})
