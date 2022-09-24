import {ImageIcon} from '@sanity/icons'
import {AssetSource} from '@sanity/types'
import {FIXME} from '../../../FIXME'
import {DefaultSource} from './DefaultSource'

export const ImageSource: AssetSource = {
  name: 'sanity-default',
  title: 'Uploaded images',
  component: DefaultSource as FIXME,
  icon: ImageIcon as FIXME,
}
