import fs from 'fs'
import path from 'path'
import assert from 'assert'
import {use, assert as assertChai} from 'chai'
import chaiExclude from 'chai-exclude'
import {Value, Operation} from 'slate'
import {List} from 'immutable'
import {
  blocksToEditorValue,
  editorValueToBlocks,
  getBlockContentFeatures
} from '@sanity/block-tools'
import blocksSchema from '../../../../fixtures/blocksSchema'
import createChangeToPatches from '../../../../../src/inputs/BlockEditor/utils/createChangeToPatches'
import createPatchesToChange from '../../../../../src/inputs/BlockEditor/utils/createPatchesToChange'
import {applyAll} from '../../../../../src/simplePatch'
import createEditorController from '../../../../../src/inputs/BlockEditor/utils/createEditorController'

use(chaiExclude)

jest.mock('part:@sanity/base/client', () => null, {virtual: true})

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

      const operations = new List(
        JSON.parse(fs.readFileSync(path.resolve(dir, 'operations.json'))).map(operation =>
          Operation.fromJSON(operation)
        )
      )

      const changeToPatches = createChangeToPatches(
        getBlockContentFeatures(blockContentType),
        blockContentType
      )

      const patchesToChange = createPatchesToChange(
        getBlockContentFeatures(blockContentType),
        blockContentType
      )

      const editorA = createEditorController({value: editorValue})
      const editorB = createEditorController({value: editorValue})

      let expectedValue = output
      let receivedValue = output
      let patches

      editorA.change(change => {
        change.applyOperations(operations)
        patches = changeToPatches(editorA.value, change, input, blockContentType)
        // Some tests creates new keys, so use hardcoded expectations for those
        expectedValue = editorValueToBlocks(
          change.value.toJSON(VALUE_TO_JSON_OPTS),
          blockContentType
        )
        // console.log(JSON.stringify(patches, null, 2))
        receivedValue = applyAll(input, patches)
      })

      // console.log(JSON.stringify(receivedValue, null, 2))
      try {
        assertChai.deepEqualExcludingEvery(receivedValue, expectedValue, '_key')
      } catch (err) {
        assert.deepEqual(receivedValue, expectedValue)
      }

      const otherClientPatchedChange = patchesToChange(patches, editorB.value, input)
      // console.log('foo')
      // console.log(JSON.stringify(otherClientPatchedChange.value.toJSON(VALUE_TO_JSON_OPTS), null, 2))
      const otherClientPatchedValue = editorValueToBlocks(
        otherClientPatchedChange.value.toJSON(VALUE_TO_JSON_OPTS),
        blockContentType
      )
      try {
        assertChai.deepEqualExcludingEvery(otherClientPatchedValue, expectedValue, '_key')
      } catch (err) {
        assert.deepEqual(otherClientPatchedValue, expectedValue)
      }
    })
  })
})
