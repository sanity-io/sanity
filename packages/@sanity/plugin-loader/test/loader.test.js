const path = require('path')
const test = require('tape')
const interopRequire = require('interop-require')
const pluginLoader = require('../loader')

test('throws if options object is not passed', t => {
  t.throws(pluginLoader, /options/)
  t.end()
})

test('allows passing *only* overrides, bypassing resolving', t => {
  const overrides = {'part:foo/bar/baz': ['moo']}
  const restore = pluginLoader({overrides})
  t.is(require('part:foo/bar/baz'), 'moo')
  restore()
  t.end()
})

test('overrides *must* be arrays', t => {
  const overrides = {'part:foo/bar/baz': 'moo'}
  t.throws(() => pluginLoader({overrides}), /array/)
  t.end()
})

test('should be able to override a part with multiple fulfillers', t => {
  const part = 'part:foo/bar/baz'
  const func1 = () => '1'
  const func2 = () => '2'

  const overrides = {[part]: [func1, func2]}
  const restore = pluginLoader({overrides})
  t.is(require(part), func1)
  t.is(require(`all:${part}`), overrides[part])
  restore()
  t.end()
})

test('should pass unmocked requests onto the default resolver', t => {
  const overrides = {foo: [{}]}
  const restore = pluginLoader({overrides})
  t.is(require('interop-require'), interopRequire)
  restore()
  t.end()
})

test('should be able to resolve an actual filesystem structure', t => {
  const restore = pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const getBar = require('part:base/bar')
  t.is(require.resolve('part:base/bar'), path.join(__dirname, 'fixture', 'getBar.js'))
  t.is(getBar(), 'bar')

  restore()
  t.end()
})

test('should be able to require all fulfillers of a part', t => {
  const start = Date.now()
  const restore = pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const timestampers = require('all:part:date/timestamp')
  t.is(timestampers.length, 2)

  timestampers.forEach(fn => {
    const stamp = fn()
    t.true(stamp > start && stamp <= Date.now())
  })

  restore()
  t.end()
})

test('should be able to include the sanity debug part', t => {
  const restore = pluginLoader({basePath: path.join(__dirname, 'fixture')})
  const debug = require('sanity:debug')
  t.is(debug.plugins[0].name, 'date')
  t.is(debug.implementations['part:base/bar'][0], path.join(__dirname, 'fixture', 'getBar.js'))
  restore()
  t.end()
})

test('should be able to load sanity instance config', t => {
  const restore = pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const config = require('config:sanity')
  t.deepEqual(config.locale.supportedLanguages, ['en-US', 'no-NB'])
  t.deepEqual(config.fromEnv, true)

  restore()
  t.end()
})

test('should be able to load config for a plugin', t => {
  const restore = pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const config = require('config:better-date')
  t.true(config.superduper)

  restore()
  t.end()
})

test('should be able to load config for a namespaced plugin', t => {
  const restore = pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const config = require('config:@sanity/some-plugin')
  t.is(config.subway, 'coding')

  restore()
  t.end()
})

test('should be able to load sanity plugin versions', t => {
  const restore = pluginLoader({basePath: path.join(__dirname, 'versionsFixture')})

  const versions = require('sanity:versions')
  t.deepEqual(versions, {
    '@sanity/base': '0.999.99',
    '@sanity/components': '0.777.77'
  })

  restore()
  t.end()
})

test('should be able to load CSS files through PostCSS', t => {
  const restore = pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const styles = require('part:date/datepicker-style')
  t.is(styles.something, 'datepicker__something___2IJMX base__base___3XsAc')
  t.is(styles.zebra, 'datepicker__zebra___1_qke')

  restore()
  t.end()
})

test('should be able stub CSS loading', t => {
  const restore = pluginLoader({basePath: path.join(__dirname, 'fixture'), stubCss: true})

  const styles = require('part:date/datepicker-style')
  t.is(typeof styles, 'object')
  t.is(Object.keys(styles).length, 0)

  restore()
  t.end()
})

test('should resolve correctly when using optional part requires (?-postfix)', t => {
  const restore = pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const getBar = require('part:base/bar?')
  t.is(require.resolve('part:base/bar?'), path.join(__dirname, 'fixture', 'getBar.js'))
  t.is(getBar(), 'bar')

  restore()
  t.end()
})

test('should resolve correctly when overriding and using optional part requires', t => {
  const overrides = {'part:base/bar': ['moo']}
  const restore = pluginLoader({basePath: path.join(__dirname, 'fixture'), overrides})

  const bar = require('part:base/bar?')
  t.is(bar, 'moo')

  restore()
  t.end()
})

test('should return undefined when using optional part requires on an unfulfilled part', t => {
  const restore = pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const result = require('part:not/existant?')
  t.is(result, undefined)

  restore()
  t.end()
})

test('should resolve parts that point to a path which is a directory containing an index.js-file', t => {
  const restore = pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const result = require('part:base/indexpart')
  t.is(result(), 'index value')

  restore()
  t.end()
})

test('should be able to override config parts', t => {
  const overrides = {'config:sanity': [{api: {projectId: 'heisann'}}]}
  const restore = pluginLoader({overrides})

  const config = require('config:sanity')
  t.is(config.api.projectId, 'heisann')

  restore()
  t.end()
})

test('should be able to get a stubbed css-custom-properties part', t => {
  const restore = pluginLoader({basePath: path.join(__dirname, 'fixture')})

  const customProps = require('sanity:css-custom-properties')
  t.is(typeof customProps, 'object')
  t.is(Object.keys(customProps).length, 0)

  restore()
  t.end()
})
