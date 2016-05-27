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
const SanityIntlProvider = proxyquire('../src/components/SanityIntlProvider', {
  'component:@sanity/base/locale/intl': require('react-intl'),
  'machine:@sanity/base/language-resolver': languageResolver,
  'machine:@sanity/base/locale-message-fetcher': require('../src/locale/messageFetcher')
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

describe('intl', () => {

  it('exposes ReactIntl', done => {
    const ReactIntl = require('../src/locale/intl')
    assert.equal(typeof ReactIntl.FormattedMessage, 'function')
    done()
  })

})


describe('SanityIntlProvider', () => {

  it('looks good', done => {
    assert.equal(typeof SanityIntlProvider, 'object')
    done()
  })

})
