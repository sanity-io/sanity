import {ImageIcon} from '@sanity/icons'
import {AssetSource} from '@sanity/types'
import {DefaultSource} from './shared/DefaultSource'

export const ImageSource: AssetSource = {
  name: 'sanity-default',
  title: 'Uploaded images',
  i18nKey: 'asset-source.image.title',
  component: DefaultSource,
  icon: ImageIcon,
}
