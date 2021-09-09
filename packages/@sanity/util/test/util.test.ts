/* eslint-disable no-sync */
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {reduceConfig, getSanityVersions, pathTools} from '../src/_exports/index'

test('merges env config', () => {
  const reduced = reduceConfig(
    {
      foo: 'bar',
      nested: {structure: true, onlyInOriginal: 'yes'},
      env: {
        production: {
          foo: 'baz',
          nested: {
            structure: false,
            otherProp: 'yup',
          },
        },
      },
    },
    'production'
  )

  expect(reduced.foo).toEqual('baz')
  expect(reduced.nested.structure).toEqual(false)
  expect(reduced.nested.onlyInOriginal).toEqual('yes')
  expect(reduced.nested.otherProp).toEqual('yup')
  expect(reduced.env).toEqual(undefined)
})

test('does not crash if there is no env config specified', () => {
  const reduced = reduceConfig(
    {
      foo: 'bar',
      nested: {structure: true, onlyInOriginal: 'yes'},
    },
    'production'
  )

  expect(reduced.foo).toEqual('bar')
  expect(reduced.nested.structure).toEqual(true)
  expect(reduced.nested.onlyInOriginal).toEqual('yes')
})

test('concats arrays', () => {
  const reduced = reduceConfig(
    {
      root: true,
      plugins: ['@sanity/base', '@sanity/desk-tool'],
      env: {development: {plugins: ['vision']}},
    },
    'development'
  )

  expect(reduced.root).toEqual(true)
  expect(reduced.plugins).toEqual(['@sanity/base', '@sanity/desk-tool', 'vision'])
})

test('getSanityVersions: extracts correct versions', () => {
  const versions = getSanityVersions(path.join(__dirname, 'versionsFixture'))
  expect(versions).toEqual({
    '@sanity/base': '0.999.99',
    '@sanity/desk-tool': '0.777.77',
  })
})

test('path tools: returns whether or not a path is empty (false)', async () => {
  const {pathIsEmpty} = pathTools
  const isEmpty = await pathIsEmpty(__dirname)
  expect(isEmpty).toEqual(false)
})

test('path tools: returns whether or not a path is empty (true)', async () => {
  const {pathIsEmpty} = pathTools
  const emptyPath = path.join(__dirname, '__temp__')
  fs.mkdirSync(emptyPath)
  const isEmpty = await pathIsEmpty(emptyPath)
  fs.rmdirSync(emptyPath)
  expect(isEmpty).toBe(true)
})

test('path tools: can expand home dirs', () => {
  const {expandHome} = pathTools
  expect(expandHome('~/tmp')).toBe(path.join(os.homedir(), 'tmp'))
})

test('path tools: can absolutify relative paths', () => {
  const {absolutify} = pathTools
  expect(absolutify('./util.test.js')).toBe(path.join(process.cwd(), 'util.test.js'))
})

test('path tools: can absolutify homedir paths', () => {
  const {absolutify} = pathTools
  expect(absolutify('~/tmp')).toBe(path.join(os.homedir(), 'tmp'))
})

test('path tools: can absolutify (noop) absolute paths', () => {
  const {absolutify} = pathTools
  expect(absolutify('/tmp/foo')).toBe('/tmp/foo')
})
