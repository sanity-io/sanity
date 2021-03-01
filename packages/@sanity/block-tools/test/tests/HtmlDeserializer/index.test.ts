import * as fs from 'fs'
import * as assert from 'assert'
import * as path from 'path'
import {JSDOM} from 'jsdom'
import blockTools from '../../../src'

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
      const fn = require(path.resolve(dir)).default
      const commonOptions = {
        parseHtml: (html) => new JSDOM(html).window.document,
      }
      const output = fn(input, blockTools, commonOptions)
      // console.log(JSON.stringify(output, null, 2))
      assert.deepEqual(output, expected)
    })
  })
})
