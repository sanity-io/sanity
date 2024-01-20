import { expect, test } from '@jest/globals';
/* eslint-disable no-sync */
import {expect, test} from '@jest/globals'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import {absolutify, expandHome, pathIsEmpty} from '../src/fsTools'

test('path tools: returns whether or not a path is empty (false)', async () => {
  const isEmpty = await pathIsEmpty(__dirname)
  expect(isEmpty).toEqual(false)
})

test('path tools: returns whether or not a path is empty (true)', async () => {
  const emptyPath = path.join(__dirname, '__temp__')
  fs.mkdirSync(emptyPath)
  const isEmpty = await pathIsEmpty(emptyPath)
  fs.rmdirSync(emptyPath)
  expect(isEmpty).toBe(true)
})

test('path tools: can expand home dirs', () => {
  expect(expandHome('~/tmp')).toBe(path.join(os.homedir(), 'tmp'))
})

test('path tools: can absolutify relative paths', () => {
  expect(absolutify('./util.test.js')).toBe(path.join(process.cwd(), 'util.test.js'))
})

test('path tools: can absolutify homedir paths', () => {
  expect(absolutify('~/tmp')).toBe(path.join(os.homedir(), 'tmp'))
})

test('path tools: can absolutify (noop) absolute paths', () => {
  expect(absolutify('/tmp/foo')).toBe('/tmp/foo')
})
