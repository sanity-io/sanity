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


// proxy all require statements which use sanity plugin syntax
const messageFetcher = proxyquire('../src/locale/messageFetcher', {
  'all:locale:@sanity/base/locale-messages': rawMessagesStub
})
proxyquire('../src/components/SanityIntlProvider', {
  'machine:@sanity/base/language-resolver': languageResolver,
  'machine:@sanity/base/locale-message-fetcher': require('../src/locale/messageFetcher')
})
proxyquire('../src/locale/index', {
  'component:@sanity/base/sanity-intl-provider': require('../src/components/SanityIntlProvider')
})


describe('languageResolver', () => {

  it('has a sane default', done => {
    languageResolver.should.eventually.equal('en-US').notify(done)
  })

})


describe('messageFetcher', () => {

  it('fetches localized messages', done => {
    const expected = {
      'foo.hello': 'Heya',
      'foo.goodbye': 'Goodbye'
    }
    messageFetcher.fetchLocalizedMessages('en-US').should.eventually.deep.equal(expected).notify(done)
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
    messageFetcher.fetchAllMessages().should.eventually.deep.equal(expected).notify(done)
  })

})


describe('locale', () => {

  it('exposes the correct stuff', done => {
    const locale = require('../src/locale')
    assert.equal(typeof locale.ReactIntl.FormattedMessage, 'function')
    assert.equal(typeof locale.SanityIntlProvider, 'function')
    done()
  })

})
