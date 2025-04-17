import {type SanityClient} from '@sanity/client'
import {DocumentsIcon, ImageIcon} from '@sanity/icons'
import {type AssetSource} from '@sanity/types'

import {DatasetAssetSource} from './shared/DatasetAssetSource'
import {createDatasetUploader} from './uploader'

// Note: Ideally this should be changed to 'sanity-dataset,
// but of legacy reasons (studio configs) we are probably stuck with it.
export const sourceName = 'sanity-default'

export interface CreateDatasetAssetSourceProps {
  client: SanityClient
  title?: string
}

/**
 * Create a new dataset internal image asset source
 *
 * @beta
 */
export function createDatasetImageAssetSource(props: CreateDatasetAssetSourceProps): AssetSource {
  return {
    name: sourceName,
    title: props.title,
    // i18nKey: 'asset-sources.dataset.image.title',
    component: DatasetAssetSource,
    icon: ImageIcon,
    uploader: createDatasetUploader(props),
  }
}

/**
 * Create a new dataset file asset source for the dataset
 *
 * @beta
 */

export function createDatasetFileAssetSource(props: CreateDatasetAssetSourceProps): AssetSource {
  return {
    name: sourceName,
    title: props.title,
    // i18nKey: 'asset-sources.dataset.file.title',
    component: DatasetAssetSource,
    icon: DocumentsIcon,
    uploader: createDatasetUploader(props),
  }
}
