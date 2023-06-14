import {BaseOperation, Editor, NodeEntry, Node} from 'slate'
import {noop} from 'lodash'
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
): {editor: PortableTextSlateEditor; subscribe: () => () => void} => {
  const e = editor as T & PortableTextSlateEditor
  const {keyGenerator, portableTextEditor, patches$, readOnly, maxBlocks} = options
  const {schemaTypes, change$} = portableTextEditor
  e.subscriptions = []
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
  const operationToPatches = createOperationToPatches(schemaTypes)
  const withObjectKeys = createWithObjectKeys(schemaTypes, keyGenerator)
  const withSchemaTypes = createWithSchemaTypes(schemaTypes)
  const withEditableAPI = createWithEditableAPI(portableTextEditor, schemaTypes, keyGenerator)
  const withPatches = createWithPatches({
    change$,
    keyGenerator,
    patches$,
    patchFunctions: operationToPatches,
    readOnly,
    schemaTypes,
  })
  const withMaxBlocks = createWithMaxBlocks(maxBlocks || -1)
  const withPortableTextLists = createWithPortableTextLists(schemaTypes)
  const withUndoRedo = createWithUndoRedo({
    readOnly,
    patches$,
    blockSchemaType: schemaTypes.block,
  })
  const withPortableTextMarkModel = createWithPortableTextMarkModel(schemaTypes)
  const withPortableTextBlockStyle = createWithPortableTextBlockStyle(schemaTypes, change$)

  const withPlaceholderBlock = createWithPlaceholderBlock({
    keyGenerator,
    schemaTypes,
  })

  const withUtils = createWithUtils({keyGenerator, schemaTypes})
  const withPortableTextSelections = createWithPortableTextSelections(change$, schemaTypes)

  e.destroy = () => {
    const originalFunctions = originalFnMap.get(e)
    if (!originalFunctions) {
      throw new Error('Could not find pristine versions of editor functions')
    }
    e.onChange = originalFunctions.onChange
    e.apply = originalFunctions.apply
    e.normalizeNode = originalFunctions.normalizeNode
  }
  if (readOnly) {
    return {
      editor: withSchemaTypes(
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
      ),
      subscribe: () => noop,
    }
  }

  // Ordering is important here, selection dealing last, data manipulation in the middle and core model stuff first.
  return {
    editor: withSchemaTypes(
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
    ),
    subscribe: () => {
      const unsubscribes: (() => void)[] = []
      editor.subscriptions.forEach((subscribeFn) => {
        unsubscribes.push(subscribeFn())
      })
      return () => {
        unsubscribes.forEach((unsubscribeFn) => {
          unsubscribeFn()
        })
      }
    },
  }
}
