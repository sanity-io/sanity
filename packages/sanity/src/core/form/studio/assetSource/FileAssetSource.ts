import {DocumentsIcon} from '@sanity/icons'
import {AssetSource} from '@sanity/types'
import {DefaultSource} from './shared/DefaultSource'

export const FileSource: AssetSource = {
  name: 'sanity-default',
  title: 'Uploaded files',
  component: DefaultSource,
  icon: DocumentsIcon,
}
