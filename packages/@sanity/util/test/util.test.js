/* eslint-disable no-sync */
import fs from 'fs'
import os from 'os'
import path from 'path'
import {describe, it} from 'mocha'
import {expect} from 'chai'
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

      expect(reduced.foo).to.equal('baz')
      expect(reduced.nested.structure).to.equal(false)
      expect(reduced.nested.onlyInOriginal).to.equal('yes')
      expect(reduced.nested.otherProp).to.equal('yup')
      expect(reduced.env).to.be.an('undefined')
    })

    it('does not crash if there is no env config specified', () => {
      const reduced = reduceConfig(
        {
          foo: 'bar',
          nested: {structure: true, onlyInOriginal: 'yes'}
        },
        'production'
      )

      expect(reduced.foo).to.equal('bar')
      expect(reduced.nested.structure).to.equal(true)
      expect(reduced.nested.onlyInOriginal).to.equal('yes')
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

      expect(reduced.root, true)
      expect(reduced.plugins).to.deep.equal(['@sanity/base', '@sanity/components', 'vision'])
    })
  })

  describe('getSanityVersions', () => {
    it('extracts correct versions', () => {
      const versions = getSanityVersions(path.join(__dirname, 'versionsFixture'))
      expect(versions).to.deep.equal({
        '@sanity/base': '0.999.99',
        '@sanity/components': '0.777.77'
      })
    })
  })

  describe('path tools', () => {
    it('returns whether or not a path is empty (false)', async () => {
      const {pathIsEmpty} = pathTools
      const isEmpty = await pathIsEmpty(__dirname)
      expect(isEmpty).to.equal(false)
    })

    it('returns whether or not a path is empty (true)', async () => {
      const {pathIsEmpty} = pathTools
      const emptyPath = path.join(__dirname, '__temp__')
      fs.mkdirSync(emptyPath)
      const isEmpty = await pathIsEmpty(emptyPath)
      fs.rmdirSync(emptyPath)
      expect(isEmpty).to.equal(true)
    })

    it('can expand home dirs', () => {
      const {expandHome} = pathTools
      expect(expandHome('~/tmp')).to.equal(path.join(os.homedir(), 'tmp'))
    })

    it('can absolutify relative paths', () => {
      const {absolutify} = pathTools
      expect(absolutify('./util.test.js')).to.equal(path.join(process.cwd(), 'util.test.js'))
    })

    it('can absolutify homedir paths', () => {
      const {absolutify} = pathTools
      expect(absolutify('~/tmp')).to.equal(path.join(os.homedir(), 'tmp'))
    })

    it('can absolutify (noop) absolute paths', () => {
      const {absolutify} = pathTools
      expect(absolutify('/tmp/foo')).to.equal('/tmp/foo')
    })
  })
})
