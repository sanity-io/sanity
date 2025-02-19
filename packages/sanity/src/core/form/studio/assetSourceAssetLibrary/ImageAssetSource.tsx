import {ImageIcon} from '@sanity/icons'
import {type AssetSource} from '@sanity/types'

import {AssetLibrarySource} from './shared/AssetLibrarySource'

export const ImageSource: AssetSource = {
  name: 'sanity-asset-library-asset-source',
  title: 'Asset Library',
  // i18nKey: 'asset-source.image.title',
  component: AssetLibrarySource,
  icon: ImageIcon,
}
