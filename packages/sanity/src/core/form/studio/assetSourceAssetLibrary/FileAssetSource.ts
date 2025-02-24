import {DocumentsIcon} from '@sanity/icons'
import {type AssetSource} from '@sanity/types'

import {AssetLibrarySource} from './shared/AssetLibrarySource'

export const FileSource: AssetSource = {
  name: 'sanity-asset-library-asset-source',
  i18nKey: 'asset-source.asset-library.file.title',
  component: AssetLibrarySource,
  icon: DocumentsIcon,
}
