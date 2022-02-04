import {SanityTool} from '@sanity/base'
import {DatabaseIcon} from '@sanity/icons'
import {DataTool} from './DataTool'

export const dataTool: SanityTool = {
  icon: DatabaseIcon,
  name: 'data',
  title: 'Data',
  options: {},
  component: DataTool,
}
