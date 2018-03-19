import assert from 'assert'
import fs from 'fs'
import path from 'path'
import {Change, Value, Operation} from 'slate'
import {List} from 'immutable'
import {blocksToEditorValue, editorValueToBlocks} from '@sanity/block-tools'
import blocksSchema from '../../../../fixtures/blocksSchema'
import changeToPatches from '../../../../../src/inputs/BlockEditor/utils/changeToPatches'
import patchesToChange from '../../../../../src/inputs/BlockEditor/utils/patchesToChange'
import {applyAll} from '../../../../../src/simplePatch'
import {resetKeyGenerator} from '../../../../setup'

const blockContentType = blocksSchema.get('blogPost').fields.find(field => field.name === 'body')
  .type

const VALUE_TO_JSON_OPTS = {
  preserveData: true,
  preserveKeys: true,
  preserveSelection: false,
  preserveHistory: false
}

function deserialize(value) {
  return Value.fromJSON(blocksToEditorValue(value, blockContentType))
}

describe('changesToPatches', () => {
  const tests = fs.readdirSync(__dirname)
  tests.forEach(test => {
    if (test[0] === '.' || path.extname(test).length > 0) {
      return
    }
    it(test, () => {
      const dir = path.resolve(__dirname, test)
      const input = JSON.parse(fs.readFileSync(path.resolve(dir, 'input.json')))
      const outputPath = path.resolve(dir, 'output.json')
      let output
      if (fs.existsSync(outputPath)) {
        output = JSON.parse(fs.readFileSync(outputPath))
      }
      const editorValue = deserialize(input)
      const otherClientEditorValue = editorValue

      const operations = new List(
        JSON.parse(fs.readFileSync(path.resolve(dir, 'operations.json'))).map(operation =>
          Operation.fromJSON(operation)
        )
      )

      const change = editorValue.change()
      change.applyOperations(operations)
      const {patches} = changeToPatches(editorValue, change, input, blockContentType)

      // Some tests creates new keys, so use hardcoded expectations for those
      let expectedValue = output
      if (!expectedValue) {
        expectedValue = editorValueToBlocks(
          change.value.toJSON(VALUE_TO_JSON_OPTS),
          blockContentType
        )
      }
      // console.log(JSON.stringify(patches, null, 2))
      const receivedValue = applyAll(input, patches)

      // console.log(JSON.stringify(receivedValue, null, 2))
      assert.deepEqual(receivedValue, expectedValue)

      const otherClientPatchedChange = patchesToChange(
        patches,
        otherClientEditorValue,
        input,
        blockContentType
      )
      const otherClientPatchedValue = editorValueToBlocks(
        otherClientPatchedChange.value.toJSON(VALUE_TO_JSON_OPTS),
        blockContentType
      )
      assert.deepEqual(otherClientPatchedValue, expectedValue)
    })
  })
})
