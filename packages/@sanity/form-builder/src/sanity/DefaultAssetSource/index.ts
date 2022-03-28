import {ImageIcon, DocumentsIcon} from '@sanity/icons'
import {AssetSource} from '@sanity/types'
import {FIXME} from '../../types'
import {DefaultSource} from './DefaultSource'

export const ImageSource: AssetSource = {
  name: 'sanity-default',
  title: 'Uploaded images',
  component: DefaultSource as FIXME,
  icon: ImageIcon as FIXME,
}

export const FileSource: AssetSource = {
  name: 'sanity-default',
  title: 'Uploaded files',
  component: DefaultSource as FIXME,
  icon: DocumentsIcon as FIXME,
}
