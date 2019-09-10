/* eslint-disable no-sync */
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {test} from 'tap'
import {reduceConfig, getSanityVersions, pathTools} from '../src'

test('merges env config', t => {
  const reduced = reduceConfig(
    {
      foo: 'bar',
      nested: {structure: true, onlyInOriginal: 'yes'},
      env: {
        production: {
          foo: 'baz',
          nested: {
            structure: false,
            otherProp: 'yup'
          }
        }
      }
    },
    'production'
  )

  t.strictDeepEquals(reduced.foo, 'baz')
  t.strictDeepEquals(reduced.nested.structure, false)
  t.strictDeepEquals(reduced.nested.onlyInOriginal, 'yes')
  t.strictDeepEquals(reduced.nested.otherProp, 'yup')
  t.strictDeepEquals(reduced.env, undefined)
  t.end()
})

test('does not crash if there is no env config specified', t => {
  const reduced = reduceConfig(
    {
      foo: 'bar',
      nested: {structure: true, onlyInOriginal: 'yes'}
    },
    'production'
  )

  t.strictDeepEquals(reduced.foo, 'bar')
  t.strictDeepEquals(reduced.nested.structure, true)
  t.strictDeepEquals(reduced.nested.onlyInOriginal, 'yes')
  t.end()
})

test('concats arrays', t => {
  const reduced = reduceConfig(
    {
      root: true,
      plugins: ['@sanity/base', '@sanity/components'],
      env: {development: {plugins: ['vision']}}
    },
    'development'
  )

  t.strictDeepEquals(reduced.root, true)
  t.strictDeepEquals(reduced.plugins, ['@sanity/base', '@sanity/components', 'vision'])
  t.end()
})

test('getSanityVersions: extracts correct versions', t => {
  const versions = getSanityVersions(path.join(__dirname, 'versionsFixture'))
  t.strictDeepEquals(versions, {
    '@sanity/base': '0.999.99',
    '@sanity/components': '0.777.77'
  })
  t.end()
})

test('path tools: returns whether or not a path is empty (false)', async t => {
  const {pathIsEmpty} = pathTools
  const isEmpty = await pathIsEmpty(__dirname)
  t.strictDeepEquals(isEmpty, false)
  t.end()
})

test('path tools: returns whether or not a path is empty (true)', async t => {
  const {pathIsEmpty} = pathTools
  const emptyPath = path.join(__dirname, '__temp__')
  fs.mkdirSync(emptyPath)
  const isEmpty = await pathIsEmpty(emptyPath)
  fs.rmdirSync(emptyPath)
  t.strictDeepEquals(isEmpty, true)
  t.end()
})

test('path tools: can expand home dirs', t => {
  const {expandHome} = pathTools
  t.strictDeepEquals(expandHome('~/tmp'), path.join(os.homedir(), 'tmp'))
  t.end()
})

test('path tools: can absolutify relative paths', t => {
  const {absolutify} = pathTools
  t.strictDeepEquals(absolutify('./util.test.js'), path.join(process.cwd(), 'util.test.js'))
  t.end()
})

test('path tools: can absolutify homedir paths', t => {
  const {absolutify} = pathTools
  t.strictDeepEquals(absolutify('~/tmp'), path.join(os.homedir(), 'tmp'))
  t.end()
})

test('path tools: can absolutify (noop) absolute paths', t => {
  const {absolutify} = pathTools
  t.strictDeepEquals(absolutify('/tmp/foo'), '/tmp/foo')
  t.end()
})
