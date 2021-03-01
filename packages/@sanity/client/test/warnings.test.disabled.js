// This test suite fails using tape but should pass if running with as a node script
const test = require('tape')
const SanityClient = require('../src/sanityClient')

const stub = (target, prop, stubbed) => {
  const original = target[prop]
  target[prop] = stubbed
  return () => {
    target[prop] = original
  }
}

const combine = (...fns) => () => {
  const [head, ...tail] = fns
  return tail.reduce((acc, fn) => fn(acc), head())
}

/**************************
 * CLIENT CONFIG WARNINGS *
 **************************/

test('warns if useCdn is not given', (t) => {
  const restore = combine(
    stub(console, 'warn', (message) => {
      t.equal(
        message,
        'You are not using the Sanity CDN. That means your data is always fresh, but the CDN is faster and cheaper. Think about it! For more info, see https://docs.sanity.io/help/js-client-cdn-configuration. To hide this warning, please set the `useCdn` option to either `true` or `false` when creating the client.'
      )
      restore()
      t.end()
    })
  )
  new SanityClient({projectId: 'abc123'})
})

test('warns if in browser on localhost and a token is provided', (t) => {
  const restore = combine(
    stub(global, 'window', {location: {hostname: 'localhost'}}),
    stub(console, 'warn', (message) => {
      t.equal(
        message,
        'You have configured Sanity client to use a token in the browser. This may cause unintentional security issues. See https://docs.sanity.io/help/js-client-browser-token for more information and how to hide this warning.'
      )
      restore()
      t.end()
    })
  )
  new SanityClient({projectId: 'abc123', useCdn: false, token: 'foo'})
})

test('warns a token is provided together with useCdn:true (and not in browser)', (t) => {
  const restore = combine(
    stub(console, 'warn', (message) => {
      t.equal(
        message,
        'You have set `useCdn` to `true` while also specifying a token. This is usually not what you want. The CDN cannot be used with an authorization token, since private data cannot be cached. See https://docs.sanity.io/help/js-client-usecdn-token for more information.'
      )
      restore()
      t.end()
    })
  )
  new SanityClient({projectId: 'abc123', token: 'foo', useCdn: true})
})
