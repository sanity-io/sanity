/* eslint-disable max-nested-callbacks */

import fs from 'fs'
import path from 'path'
import assert from 'assert'
import {List} from 'immutable'
import {
  blocksToEditorValue,
  editorValueToBlocks,
  getBlockContentFeatures
} from '@sanity/block-tools'
import blocksSchema from '../../../../fixtures/blocksSchema'
import buildEditorSchema from '../../../../../src/inputs/BlockEditor/utils/buildEditorSchema'
import createOperationToPatches from '../../../../../src/inputs/BlockEditor/utils/createOperationToPatches'
import createPatchToOperations from '../../../../../src/inputs/BlockEditor/utils/createPatchToOperations'
import {applyAll} from '../../../../../src/simplePatch'
import createEditorController from '../../../../../src/inputs/BlockEditor/utils/createEditorController'
import {Value, Operation} from 'slate'

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

const blockContentFeatures = getBlockContentFeatures(blockContentType)
const editorSchema = buildEditorSchema(blockContentFeatures)

const controllerOpts = {
  plugins: [
    {
      schema: editorSchema
    }
  ]
}

describe('Block editor operations to patches and back to operations', () => {
  const tests = fs.readdirSync(__dirname)
  tests.forEach(test => {
    if (test[0] === '.' || path.extname(test).length > 0) {
      return
    }
    it(test, () => {
      const dir = path.resolve(__dirname, test)
      const input = JSON.parse(fs.readFileSync(path.resolve(dir, 'input.json')))
      const editorValue = deserialize(input)
      const operationToPatches = createOperationToPatches(
        getBlockContentFeatures(blockContentType),
        blockContentType
      )

      const patchToOperations = createPatchToOperations(
        getBlockContentFeatures(blockContentType),
        blockContentType
      )
      const operations = new List(
        JSON.parse(fs.readFileSync(path.resolve(dir, 'operations.json'))).map(operation =>
          Operation.fromJSON(operation)
        )
      )

      const editorA = createEditorController({...controllerOpts, value: editorValue})
      const editorB = createEditorController({...controllerOpts, value: editorValue})

      let patches
      let document = input

      // Run each operation through editorA, patch document, patch editorB
      operations.forEach(op => {
        const beforeValue = editorA.value
        editorA.applyOperation(op)
        patches = operationToPatches(op, beforeValue, editorA.value, document)
        document = applyAll(document, patches)
        patches.forEach(patch => {
          patchToOperations(patch, editorB.value).forEach(patchOp => {
            editorB.applyOperation(patchOp)
          })
        })
      })

      // Serialize final editor values
      const editorASerialized = editorValueToBlocks(
        editorA.value.toJSON(VALUE_TO_JSON_OPTS),
        blockContentType
      )
      const editorBSerialized = editorValueToBlocks(
        editorB.value.toJSON(VALUE_TO_JSON_OPTS),
        blockContentType
      )

      // Test that the serialized editorA value is the same as the patched document
      assert.deepEqual(document, editorASerialized)

      // Test that both editor have the same value
      assert.deepEqual(editorBSerialized, editorASerialized)
      // console.log(JSON.stringify(document, null, 2))
    })
  })
})
