/* eslint-disable no-sync */
import fs from 'fs'
import os from 'os'
import path from 'path'
import {reduceConfig, getSanityVersions, pathTools} from '../src'

describe('util', () => {
  describe('reduceConfig', () => {
    it('merges env config', () => {
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

      expect(reduced.foo).toEqual('baz')
      expect(reduced.nested.structure).toEqual(false)
      expect(reduced.nested.onlyInOriginal).toEqual('yes')
      expect(reduced.nested.otherProp).toEqual('yup')
      expect(reduced.env).toBeUndefined()
    })

    it('does not crash if there is no env config specified', () => {
      const reduced = reduceConfig(
        {
          foo: 'bar',
          nested: {structure: true, onlyInOriginal: 'yes'}
        },
        'production'
      )

      expect(reduced.foo).toEqual('bar')
      expect(reduced.nested.structure).toEqual(true)
      expect(reduced.nested.onlyInOriginal).toEqual('yes')
    })

    it('concats arrays', () => {
      const reduced = reduceConfig(
        {
          root: true,
          plugins: ['@sanity/base', '@sanity/components'],
          env: {development: {plugins: ['vision']}}
        },
        'development'
      )

      expect(reduced.root).toBe(true)
      expect(reduced.plugins).toEqual(['@sanity/base', '@sanity/components', 'vision'])
    })
  })

  describe('getSanityVersions', () => {
    it('extracts correct versions', () => {
      const versions = getSanityVersions(path.join(__dirname, 'versionsFixture'))
      expect(versions).toEqual({
        '@sanity/base': '0.999.99',
        '@sanity/components': '0.777.77'
      })
    })
  })

  describe('path tools', () => {
    it('returns whether or not a path is empty (false)', async () => {
      const {pathIsEmpty} = pathTools
      const isEmpty = await pathIsEmpty(__dirname)
      expect(isEmpty).toEqual(false)
    })

    it('returns whether or not a path is empty (true)', async () => {
      const {pathIsEmpty} = pathTools
      const emptyPath = path.join(__dirname, '__temp__')
      fs.mkdirSync(emptyPath)
      const isEmpty = await pathIsEmpty(emptyPath)
      fs.rmdirSync(emptyPath)
      expect(isEmpty).toEqual(true)
    })

    it('can expand home dirs', () => {
      const {expandHome} = pathTools
      expect(expandHome('~/tmp')).toEqual(path.join(os.homedir(), 'tmp'))
    })

    it('can absolutify relative paths', () => {
      const {absolutify} = pathTools
      expect(absolutify('./util.test.js')).toEqual(path.join(process.cwd(), 'util.test.js'))
    })

    it('can absolutify homedir paths', () => {
      const {absolutify} = pathTools
      expect(absolutify('~/tmp')).toEqual(path.join(os.homedir(), 'tmp'))
    })

    it('can absolutify (noop) absolute paths', () => {
      const {absolutify} = pathTools
      expect(absolutify('/tmp/foo')).toEqual('/tmp/foo')
    })
  })
})
