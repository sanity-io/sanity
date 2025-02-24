import {ImageIcon} from '@sanity/icons'
import {type AssetSource} from '@sanity/types'

import {AssetLibrarySource} from './shared/AssetLibrarySource'

export const ImageSource: AssetSource = {
  name: 'sanity-asset-library-asset-source',
  i18nKey: 'asset-source.asset-library.image.title',
  component: AssetLibrarySource,
  icon: ImageIcon,
}
