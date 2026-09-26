import {type SanityClient} from '@sanity/client'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {ImageIcon} from '@sanity/icons/Image'
import {type AssetSource} from '@sanity/types'

import {createLazyComponent} from '../../../components/lazy/createLazyComponent'
import {createDatasetUploader} from './uploader'

// The asset sources are created while the workspace config is prepared; the browse dialog they
// render only loads once a user opens it from a file or image input.
const DatasetAssetSource = createLazyComponent(() =>
  import('./shared/DatasetAssetSource').then((module) => module.DatasetAssetSource),
)

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
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    title: props.title,
    // i18nKey: 'asset-sources.dataset.image.title',
    component: DatasetAssetSource,
    icon: ImageIcon,
    Uploader: createDatasetUploader(props),
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
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    title: props.title,
    // i18nKey: 'asset-sources.dataset.file.title',
    component: DatasetAssetSource,
    icon: DocumentsIcon,
    Uploader: createDatasetUploader(props),
  }
}
