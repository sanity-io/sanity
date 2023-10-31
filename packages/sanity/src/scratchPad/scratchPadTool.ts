import {BulbFilledIcon} from '@sanity/icons'
import {lazy} from 'react'
import {definePlugin} from 'sanity'

const ScratchPadRoot = lazy(() => import('./components/Root'))

export interface ScratchPadToolOptions {
  icon?: React.ComponentType
  name?: string
  title?: string
}

export const scratchPadTool = definePlugin<ScratchPadToolOptions | void>((options) => ({
  name: '@sanity/scratchpad-tool',
  form: {
    components: {
      // No field like field
      field: (fieldProps) => {
        return fieldProps.children
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
