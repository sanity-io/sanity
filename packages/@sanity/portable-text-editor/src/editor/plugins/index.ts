import {BaseOperation, Editor, NodeEntry, Node} from 'slate'
import {PortableTextSlateEditor} from '../../types/editor'
import {createEditorOptions} from '../../types/options'
import {createOperationToPatches} from '../../utils/operationToPatches'
import {createWithEditableAPI} from './createWithEditableAPI'
import {createWithMaxBlocks} from './createWithMaxBlocks'
import {createWithObjectKeys} from './createWithObjectKeys'
import {createWithPatches} from './createWithPatches'
import {createWithPlaceholderBlock} from './createWithPlaceholderBlock'
import {createWithPortableTextBlockStyle} from './createWithPortableTextBlockStyle'
import {createWithPortableTextLists} from './createWithPortableTextLists'
import {createWithPortableTextMarkModel} from './createWithPortableTextMarkModel'
import {createWithPortableTextSelections} from './createWithPortableTextSelections'
import {createWithSchemaTypes} from './createWithSchemaTypes'
import {createWithUndoRedo} from './createWithUndoRedo'
import {createWithUtils} from './createWithUtils'

export {createWithEditableAPI} from './createWithEditableAPI'
export {createWithHotkeys} from './createWithHotKeys'
export {createWithInsertData} from './createWithInsertData'
export {createWithMaxBlocks} from './createWithMaxBlocks'
export {createWithObjectKeys} from './createWithObjectKeys'
export {createWithPatches} from './createWithPatches'
export {createWithPortableTextBlockStyle} from './createWithPortableTextBlockStyle'
export {createWithPortableTextLists} from './createWithPortableTextLists'
export {createWithPortableTextMarkModel} from './createWithPortableTextMarkModel'
export {createWithPortableTextSelections} from './createWithPortableTextSelections'
export {createWithSchemaTypes} from './createWithSchemaTypes'
export {createWithUndoRedo} from './createWithUndoRedo'
export {createWithUtils} from './createWithUtils'

export interface OriginalEditorFunctions {
  apply: (operation: BaseOperation) => void
  onChange: () => void
  normalizeNode: (entry: NodeEntry<Node>) => void
}

const originalFnMap = new WeakMap<PortableTextSlateEditor, OriginalEditorFunctions>()

export const withPlugins = <T extends Editor>(
  editor: T,
  options: createEditorOptions
): PortableTextSlateEditor => {
  const e = editor as T & PortableTextSlateEditor
  const {portableTextEditor} = options
  const {portableTextFeatures, keyGenerator, readOnly, change$, syncValue, incomingPatches$} =
    portableTextEditor
  e.maxBlocks = portableTextEditor.maxBlocks || -1
  e.readOnly = portableTextEditor.readOnly || false
  if (e.destroy) {
    e.destroy()
  } else {
    // Save a copy of the original editor functions here before they were changed by plugins.
    // We will put them back when .destroy is called (see below).
    originalFnMap.set(e, {
      apply: e.apply,
      onChange: e.onChange,
      normalizeNode: e.normalizeNode,
    })
  }
  const operationToPatches = createOperationToPatches(portableTextFeatures)
  const withObjectKeys = createWithObjectKeys(portableTextFeatures, keyGenerator)
  const withSchemaTypes = createWithSchemaTypes(portableTextFeatures)
  const withEditableAPI = createWithEditableAPI(
    portableTextEditor,
    portableTextFeatures,
    keyGenerator
  )
  const [withPatches, withPatchesCleanupFunction] = readOnly
    ? []
    : createWithPatches({
        patchFunctions: operationToPatches,
        change$,
        portableTextFeatures,
        syncValue,
        incomingPatches$,
      })
  const withMaxBlocks = createWithMaxBlocks()
  const withPortableTextLists = createWithPortableTextLists(portableTextFeatures)
  const [withUndoRedo, withUndoRedoCleanupFunction] = readOnly
    ? []
    : createWithUndoRedo(incomingPatches$)
  const withPortableTextMarkModel = createWithPortableTextMarkModel(
    portableTextFeatures,
    keyGenerator
  )
  const withPortableTextBlockStyle = createWithPortableTextBlockStyle(portableTextFeatures, change$)

  const withPlaceholderBlock = createWithPlaceholderBlock({
    keyGenerator,
    portableTextFeatures,
  })

  const withUtils = createWithUtils({keyGenerator, portableTextFeatures})
  const withPortableTextSelections = createWithPortableTextSelections(change$, portableTextFeatures)

  e.destroy = () => {
    const originalFunctions = originalFnMap.get(e)
    if (!originalFunctions) {
      throw new Error('Could not find pristine versions of editor functions')
    }
    e.onChange = originalFunctions.onChange
    e.apply = originalFunctions.apply
    e.normalizeNode = originalFunctions.normalizeNode
    if (withPatchesCleanupFunction) {
      withPatchesCleanupFunction()
    }
    if (withUndoRedoCleanupFunction) {
      withUndoRedoCleanupFunction()
    }
  }
  if (readOnly) {
    return withSchemaTypes(
      withObjectKeys(
        withPortableTextMarkModel(
          withPortableTextBlockStyle(
            withUtils(
              withPlaceholderBlock(
                withPortableTextLists(withPortableTextSelections(withEditableAPI(e)))
              )
            )
          )
        )
      )
    )
  }

  // The 'if' here is only to satisfy Typscript
  if (withUndoRedo && withPatches) {
    // Ordering is important here, selection dealing last, data manipulation in the middle and core model stuff first.
    return withSchemaTypes(
      withObjectKeys(
        withPortableTextMarkModel(
          withPortableTextBlockStyle(
            withPortableTextLists(
              withPlaceholderBlock(
                withUtils(
                  withMaxBlocks(
                    withUndoRedo(withPatches(withPortableTextSelections(withEditableAPI(e))))
                  )
                )
              )
            )
          )
        )
      )
    )
  }
  return e
}
