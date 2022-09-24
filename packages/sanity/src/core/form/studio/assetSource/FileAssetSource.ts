import {DocumentsIcon} from '@sanity/icons'
import {AssetSource} from '@sanity/types'
import {FIXME} from '../../../FIXME'
import {DefaultSource} from './DefaultSource'

export const FileSource: AssetSource = {
  name: 'sanity-default',
  title: 'Uploaded files',
  component: DefaultSource as FIXME,
  icon: DocumentsIcon as FIXME,
}
