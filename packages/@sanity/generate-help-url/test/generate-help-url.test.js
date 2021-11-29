/* eslint-disable id-length */
const test = require('tape')
const generateHelpUrl = require('..')

test('should generate valid url', function (t) {
  t.equals(generateHelpUrl('foo-bar'), 'https://docs.sanity.io/help/foo-bar')
  t.end()
})
