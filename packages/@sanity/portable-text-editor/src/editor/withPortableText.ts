import {Editor} from 'slate'
import {createOperationToPatches} from '../utils/operationToPatches'
import {createEditorOptions} from '../types/options'
import {PortableTextSlateEditor} from '../types/editor'
import {debugWithName} from '../utils/debug'
import {
  createWithObjectKeys,
  createWithPortableTextMarkModel,
  createWithPortableTextSelections,
  createWithSchemaTypes,
  createWithPatches,
  createWithMaxBlocks,
  createWithPortableTextLists,
  createWithUndoRedo,
  createWithPortableTextBlockStyle,
  createWithUtils,
} from './plugins'

const debug = debugWithName('createPortableTextEditor')

const disablePlugin = (
  name: string
): ((editor: PortableTextSlateEditor) => PortableTextSlateEditor) => {
  debug(`Editor plugin '${name}' is disabled`)
  // This is the signature of a minimal Slate plugin
  return (editor: PortableTextSlateEditor) => {
    // Do some transformations here...
    return editor // Return void to stop the plugin chain here
  }
}

export const withPortableText = <T extends Editor>(
  editor: T,
  options: createEditorOptions
): PortableTextSlateEditor => {
  const e = editor as T & PortableTextSlateEditor
  const {
    portableTextFeatures,
    keyGenerator,
    change$,
    maxBlocks,
    incomingPatches$,
    readOnly,
  } = options
  const operationToPatches = createOperationToPatches(portableTextFeatures)
  const withObjectKeys = createWithObjectKeys(portableTextFeatures, keyGenerator)
  const withSchemaTypes = createWithSchemaTypes(portableTextFeatures)
  const withPatches = readOnly
    ? disablePlugin('withPatches')
    : createWithPatches(operationToPatches, change$, portableTextFeatures, incomingPatches$)

  const withMaxBlocks =
    maxBlocks && maxBlocks > 0 ? createWithMaxBlocks(maxBlocks) : disablePlugin('withMaxBlocks')
  const withPortableTextLists = createWithPortableTextLists(portableTextFeatures)
  const withUndoRedo = readOnly
    ? disablePlugin('withUndoRedo')
    : createWithUndoRedo(incomingPatches$)
  const withPortableTextMarkModel = createWithPortableTextMarkModel(portableTextFeatures)
  const withPortableTextBlockStyle = createWithPortableTextBlockStyle(portableTextFeatures, change$)
  const withUtils = createWithUtils(portableTextFeatures)
  const withPortableTextSelections = createWithPortableTextSelections(change$)

  // Ordering is important here, selection dealing last, data manipulation in the middle and core model stuff first.
  return withSchemaTypes(
    withObjectKeys(
      withPortableTextMarkModel(
        withPortableTextBlockStyle(
          withPortableTextLists(
            withUtils(withMaxBlocks(withUndoRedo(withPatches(withPortableTextSelections(e)))))
          )
        )
      )
    )
  )
}
