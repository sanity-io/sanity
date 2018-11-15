import {flatten} from 'lodash'
import {getBlockContentFeatures} from '@sanity/block-tools'

import buildEditorSchema from '../../../../../src/inputs/BlockEditor/utils/buildEditorSchema'

import createOperationToPatches from '../../../../../src/inputs/BlockEditor/utils/createOperationToPatches'
import createPatchToOperations from '../../../../../src/inputs/BlockEditor/utils/createPatchToOperations'

import {
  localChanges$,
  remoteChanges$,
  changes$
} from '../../../../../src/inputs/BlockEditor/utils/changeObservers'
import createEditorController from '../../../../../src/inputs/BlockEditor/utils/createEditorController'

// A minimal editor for testing purposes
export default class Editor {
  constructor(editorValue, blockContentType) {
    const blockContentFeatures = getBlockContentFeatures(blockContentType)
    const editorSchema = buildEditorSchema(blockContentFeatures)
    const controllerOpts = {
      plugins: [
        {
          schema: editorSchema
        }
      ]
    }
    this.controller = createEditorController({...controllerOpts, value: editorValue})
    this.controller.onChange = this.onChange
    this.stateValue = this.controller.value
    this.changeSubscription = changes$.subscribe(this.handleChangeSet)
  }

  handleIncomingPatches(patches) {
    patches.forEach(patch => {
      remoteChanges$.next({
        isRemote: true,
        operations: createPatchToOperations(patch, this.stateValue)
      })
    })
  }

  onChange = editor => {
    const {operations} = editor
    localChanges$.next({
      isRemote: false,
      operations
    })
  }

  handleChangeSet = changeSet => {
    const {operations, isRemote} = changeSet
    const localPatches = []
    operations.forEach(op => {
      if (isRemote) {
        this.controller.applyOperation(op)
      }
      if (!isRemote) {
        this.controller.applyOperation(op)
        localPatches.push(createOperationToPatches(op, this.stateValue, this.controller.value))
      }
    })
    this.stateValue = this.controller.value
  }
}
