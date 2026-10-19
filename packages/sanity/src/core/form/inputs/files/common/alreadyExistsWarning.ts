import {type AssetSourceUploadFile} from '@sanity/types'
import {type useToast} from '@sanity/ui/toast'

import {type TFunction} from '../../../../i18n/types'

/**
 * Pushes a "file already exists, using the existing one" warning toast for
 * every deduplicated file in an uploader's `all-complete` event.
 *
 * Duplicate-detection warnings must be pushed by the uploader's subscriber
 * (the field or input that started the upload): the asset source's own
 * components are unmounted by the `onSelect` reset before the terminal
 * statuses land, so a subscription there never sees the event. Every
 * `uploader.subscribe` site that handles `all-complete` should call this —
 * single file/image/video fields (`useAssetSourceUploader`) and array /
 * Portable Text drops (`ArrayOfObjectsField`) alike.
 *
 * @internal
 */
export function pushAlreadyExistsWarnings(options: {
  files: AssetSourceUploadFile[] | undefined
  push: ReturnType<typeof useToast>['push']
  t: TFunction
}): void {
  const {files, push, t} = options
  files
    ?.filter((file) => file.status === 'alreadyExists')
    .forEach((file) => {
      push({
        status: 'warning',
        title: t('asset-sources.common.warning.file-already-exist.title', {
          filename: file.file.name,
        }),
        description: t('asset-sources.common.warning.file-already-exist.description'),
        closable: true,
        duration: 10000,
      })
    })
}
