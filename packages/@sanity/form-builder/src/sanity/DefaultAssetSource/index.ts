import {ImageIcon, DocumentsIcon} from '@sanity/icons'
import {DefaultSource} from './DefaultSource'

export const ImageSource = {
  name: 'sanity-default',
  title: 'Uploaded images',
  component: DefaultSource,
  icon: ImageIcon,
}

export const FileSource = {
  name: 'sanity-default',
  title: 'Uploaded files',
  component: DefaultSource,
  icon: DocumentsIcon,
}
