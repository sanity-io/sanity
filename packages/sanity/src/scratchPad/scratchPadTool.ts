import {BulbFilledIcon} from '@sanity/icons'
import {route} from 'sanity/router'
import ScratchPadRoot from './components/Root'
import {documentType, portableTextType} from './config'
import {definePlugin, isArrayOfBlocksSchemaType} from 'sanity'

/**
 * @alpha
 */
export {ScratchPadInput} from './components/editor/Input'

/**
 * @alpha
 */
export {ScratchPadProvider} from './context/ScratchPadProvider'

/**
 * @alpha
 */
export interface ScratchPadToolOptions {
  icon?: React.ComponentType
  name?: string
  title?: string
}
/**
 * @alpha
 */
export const scratchPadTool = definePlugin<ScratchPadToolOptions | void>((options) => ({
  name: '@sanity/scratchpad-tool',
  schema: {
    types: [portableTextType, documentType],
  },
  form: {
    components: {
      field: (fieldProps) => {
        // No 'chrome' for the PT field
        if (isArrayOfBlocksSchemaType(fieldProps.schemaType)) {
          return fieldProps.children
        }
        return fieldProps.renderDefault(fieldProps)
      },
    },
  },
  tools: [
    {
      name: options?.name || 'scratchPad',
      title: options?.title || 'Scratch Pad',
      icon: options?.icon || BulbFilledIcon,
      component: ScratchPadRoot,
      options,
      router: route.create('/', [route.create('/:path')]),
    },
  ],
}))
