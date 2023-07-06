import {RocketIcon} from '@sanity/icons'
import {defineDocumentInspector} from 'sanity'
import {CustomInspector} from './inspector'

export const customInspector = defineDocumentInspector({
  name: 'custom',
  useMenuItem: () => ({
    icon: RocketIcon,
    showAsAction: true,
    title: 'Custom inspector',
  }),
  component: CustomInspector,
})
