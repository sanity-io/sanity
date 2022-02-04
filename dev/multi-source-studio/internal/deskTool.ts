import {deskTool} from '@sanity/desk-tool'
import {LockIcon} from '@sanity/icons'

export const internalDeskTool = deskTool({
  source: 'internal',
  name: 'internal',
  title: 'Internal',
  icon: LockIcon,
})
