import {BulbFilledIcon} from '@sanity/icons'
import {lazy} from 'react'
import {definePlugin, isArrayOfBlocksSchemaType} from 'sanity'

const ScratchPadRoot = lazy(() => import('./components/Root'))

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
    },
  ],
}))
