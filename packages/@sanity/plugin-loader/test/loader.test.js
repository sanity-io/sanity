import path from 'path'
import test from 'ava'
import pluginLoader from '../loader'
import interopRequire from 'interop-require'

test('throws if options object is not passed', t => {
  t.throws(pluginLoader, /options/)
})

test('allows passing *only* overrides, bypassing resolving', t => {
  const overrides = {'part:foo/bar/baz': ['moo']}
  pluginLoader({overrides})
  t.is(require('part:foo/bar/baz'), 'moo')
})

test('overrides *must* be arrays', t => {
  const overrides = {'part:foo/bar/baz': 'moo'}
  t.throws(() => pluginLoader({overrides}), /array/)
})

test('should be able to override a role with multiple fulfillers', t => {
  const role = 'part:foo/bar/baz'
  const func1 = () => '1'
  const func2 = () => '2'

  const overrides = {[role]: [func1, func2]}
  pluginLoader({overrides})
  t.is(require(role), func1)
  t.is(require(`all:${role}`), overrides[role])
})

test('should pass unmocked requests onto the default resolver', t => {
  const overrides = {foo: [{}]}
  pluginLoader({overrides})
  t.is(require('interop-require'), interopRequire)
})

test('should be able to resolve an actual filesystem structure', t => {
  pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const getBar = require('part:base/bar')
  t.is(require.resolve('part:base/bar'), path.join(__dirname, 'fixture', 'getBar.js'))
  t.is(getBar(), 'bar')
})

test('should be able to require all fulfillers of a role', t => {
  const start = Date.now()
  pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const timestampers = require('all:part:date/timestamp')
  t.is(timestampers.length, 2)

  timestampers.forEach(fn => {
    const stamp = fn()
    t.true(stamp > start && stamp <= Date.now())
  })
})

test('should be able to include the sanity debug role', t => {
  pluginLoader({basePath: path.join(__dirname, 'fixture')})
  const debug = require('sanity:debug')
  t.is(debug.plugins[0].name, 'date')
  t.is(
    debug.implementations['part:base/bar'][0],
    path.join(__dirname, 'fixture', 'getBar.js')
  )
})

test('should be able to load sanity instance config', t => {
  pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const config = require('config:sanity')
  t.deepEqual(config.locale.supportedLanguages, ['en-US', 'no-NB'])
  t.deepEqual(config.fromEnv, true)
})

test('should be able to load config for a plugin', t => {
  pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const config = require('config:better-date')
  t.true(config.superduper)
})

test('should be able to load CSS files through PostCSS', t => {
  pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const styles = require('part:date/datepicker-style')
  t.is(styles.something, 'datepicker__something___2XYYD base__base___2r-NO')
  t.is(styles.zebra, 'datepicker__zebra___3-rtJ')
})

test('should resolve correctly when using optional role requires (?-postfix)', t => {
  pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const getBar = require('part:base/bar?')
  t.is(require.resolve('part:base/bar?'), path.join(__dirname, 'fixture', 'getBar.js'))
  t.is(getBar(), 'bar')
})

test('should resolve correctly when overriding and using optional role requires', t => {
  const overrides = {'part:base/bar': ['moo']}
  pluginLoader({basePath: path.join(__dirname, 'fixture'), overrides})

  const bar = require('part:base/bar?')
  t.is(bar, 'moo')
})

test('should return undefined when using optional role requires on an unfulfilled role', t => {
  pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const result = require('part:not/existant?')
  t.is(result, undefined)
})

test('should resolve parts that point to a path which is a directory containing an index.js-file', t => {
  pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const result = require('part:base/indexpart')
  t.is(result(), 'index value')
})
