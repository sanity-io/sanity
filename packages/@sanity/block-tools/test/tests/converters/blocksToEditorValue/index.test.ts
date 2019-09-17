import * as fs from 'fs'
import * as assert from 'assert'
import * as path from 'path'
import blockTools from '../../../../src'

describe('blocksToSlateState', () => {
  const tests = fs.readdirSync(__dirname)
  tests.forEach(test => {
    if (test[0] === '.' || path.extname(test).length > 0) {
      return
    }
    it(test, () => {
      const dir = path.resolve(__dirname, test)
      const input = JSON.parse(fs.readFileSync(path.resolve(dir, 'input.json'), 'utf-8'))
      const expected = JSON.parse(fs.readFileSync(path.resolve(dir, 'output.json'), 'utf-8'))
      const fn = require(path.resolve(dir)).default // eslint-disable-line import/no-dynamic-require
      const output = fn(blockTools.blocksToEditorValue, input)
      assert.deepEqual(output, expected)
    })
  })
})
