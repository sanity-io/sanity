import path from 'path'
import test from 'ava'
import pluginLoader from '../loader'
import interopRequire from 'interop-require'

test('throws if options object is not passed', t => {
  t.throws(pluginLoader, /options/)
})

test('allows passing *only* overrides, bypassing resolving', t => {
  const overrides = {'component:foo/bar/baz': ['moo']}
  pluginLoader({overrides})
  t.is(require('component:foo/bar/baz'), 'moo')
})

test('overrides *must* be arrays', t => {
  const overrides = {'component:foo/bar/baz': 'moo'}
  t.throws(() => pluginLoader({overrides}), /array/)
})

test('should be able to override a role with multiple fulfillers', t => {
  const role = 'component:foo/bar/baz'
  const func1 = () => '1'
  const func2 = () => '2'

  const overrides = {[role]: [func1, func2]}
  pluginLoader({overrides})
  t.is(require(role), func1)
  t.is(require('all:' + role), overrides[role])
})

test('should pass unmocked requests onto the default resolver', t => {
  const overrides = {'foo': [{}]}
  pluginLoader({overrides})
  t.is(require('interop-require'), interopRequire)
})

test('should be able to resolve an actual filesystem structure', t => {
  pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const getBar = require('function:base/bar')
  t.is(require.resolve('function:base/bar'), path.join(__dirname, 'fixture', 'getBar.js'))
  t.is(getBar(), 'bar')
})

test('should be able to require all fulfillers of a role', t => {
  const start = Date.now()
  pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const timestampers = require('all:function:date/timestamp')
  t.is(timestampers.length, 2)

  const results = timestampers.forEach(fn => {
    const stamp = fn()
    t.true(stamp > start && stamp <= Date.now())
  })
})

test('should be able to include the sanity debug role', t => {
  pluginLoader({basePath: path.join(__dirname, 'fixture')})
  const debug = require('sanity:debug')
  t.is(debug.plugins[0].name, 'date')
  t.is(
    debug.fulfilled['function:base/bar'][0],
    path.join(__dirname, 'fixture', 'getBar.js')
  )
})

test('should be able to load sanity instance config', t => {
  pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const config = require('config:sanity')
  t.deepEqual(config.locale.supportedLanguages, ['en-US', 'no-NB'])
})

test('should be able to load config for a plugin', t => {
  pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const config = require('config:better-date')
  t.true(config.superduper)
})
