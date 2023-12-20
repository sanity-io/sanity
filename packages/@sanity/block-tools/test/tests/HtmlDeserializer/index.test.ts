import * as fs from 'fs'
import * as assert from 'assert'
import * as path from 'path'
import {JSDOM} from 'jsdom'
import * as blockTools from '../../../src'
import type {BlockTestFn} from './types'

describe('HtmlDeserializer', () => {
  const tests = fs.readdirSync(__dirname)
  tests.forEach((test) => {
    if (test[0] === '.' || path.extname(test).length > 0) {
      return
    }
    it(test, () => {
      const dir = path.resolve(__dirname, test)
      const input = fs.readFileSync(path.resolve(dir, 'input.html')).toString()
      const expected = JSON.parse(fs.readFileSync(path.resolve(dir, 'output.json'), 'utf-8'))
      // eslint-disable-next-line import/no-dynamic-require
      const fn = require(path.resolve(dir)).default as BlockTestFn
      const commonOptions = {
        parseHtml: (html: string) => new JSDOM(html).window.document,
      }
      const output = fn(input, blockTools, commonOptions)
      // fs.writeFileSync(path.resolve(dir, 'expected.json'), JSON.stringify(output, null, 2))
      // console.log(JSON.stringify(output, null, 2))
      assert.deepStrictEqual(output, expected)
    })
  })
})
