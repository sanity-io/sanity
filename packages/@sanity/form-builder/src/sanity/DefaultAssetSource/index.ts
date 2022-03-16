import {ImageIcon, DocumentsIcon} from '@sanity/icons'
import {AssetSource} from '@sanity/types'
import {DefaultSource} from './DefaultSource'

export const ImageSource: AssetSource = {
  name: 'sanity-default',
  title: 'Uploaded images',
  component: DefaultSource as any,
  icon: ImageIcon,
}

export const FileSource: AssetSource = {
  name: 'sanity-default',
  title: 'Uploaded files',
  component: DefaultSource as any,
  icon: DocumentsIcon,
}
