import {type AssetFromSource, type FileSchemaType} from '@sanity/types'

import {type FIXME} from '../../../../FIXME'
import type {FormPatch} from '../../../patch/types'
import type {PatchEvent} from '../../../patch/PatchEvent'
import {set, setIfMissing, unset} from '../../../patch/patch'
import {
  type Uploader,
  type UploaderResolver,
  type UploadOptions,
} from '../../../studio/uploads/types'
import {base64ToFile, urlToFile} from '../ImageInput/utils/image'

// We alias DOM File type here to distinguish it from the type of the File value
type DOMFile = globalThis.File

interface Props {
  assetsFromSource: AssetFromSource[]
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void
  type: FileSchemaType
  resolveUploader: UploaderResolver
  uploadWith: (uploader: Uploader, file: DOMFile, assetDocumentProps?: UploadOptions) => void
  isImage?: boolean
}

export function handleSelectAssetFromSource({
  assetsFromSource,
  onChange,
  type,
  resolveUploader,
  uploadWith,
  isImage,
}: Props): void {
  // const {onChange, type, resolveUploader} = this.props
  if (!assetsFromSource) {
    throw new Error('No asset given')
  }
  if (!Array.isArray(assetsFromSource) || assetsFromSource.length === 0) {
    throw new Error('Returned value must be an array with at least one item (asset)')
  }
  const firstAsset = assetsFromSource[0]
  const assetProps = firstAsset.assetDocumentProps
  const mediaLibraryProps = firstAsset.mediaLibraryProps
  const originalFilename = assetProps?.originalFilename
  const label = assetProps?.label
  const title = assetProps?.title
  const description = assetProps?.description
  const creditLine = assetProps?.creditLine
  const source = assetProps?.source
  const assetPatches: FormPatch[] = isImage
    ? [unset(['hotspot']), unset(['crop']), unset(['media'])]
    : [unset(['media'])]

  // If the asset is from an media library, we need to set the media reference,
  // so that the Media Library can backtrack the usage of that asset.
  if (mediaLibraryProps) {
    const assetContainerRef = {
      _type: 'globalDocumentReference',
      _ref: `media-library:${mediaLibraryProps.mediaLibraryId}:${mediaLibraryProps.assetId}`,
      _weak: true,
    }
    assetPatches.push(set(assetContainerRef, ['media']))
  }

  switch (firstAsset.kind) {
    case 'assetDocumentId':
      onChange([
        setIfMissing({
          _type: type.name,
        }),
        ...assetPatches,
        set(
          {
            _type: 'reference',
            _ref: firstAsset.value,
          },

          ['asset'],
        ),
      ])

      break
    case 'file': {
      const uploader = resolveUploader(type, firstAsset.value as FIXME)
      if (uploader) {
        uploadWith(uploader, firstAsset.value as FIXME, {
          label,
          title,
          description,
          creditLine,
          source,
        })
      }
      break
    }
    case 'base64':
      base64ToFile(firstAsset.value as FIXME, originalFilename).then((file) => {
        const uploader = resolveUploader(type, file)
        if (uploader) {
          uploadWith(uploader, file, {label, title, description, creditLine, source})
        }
      })
      break
    case 'url':
      urlToFile(firstAsset.value as FIXME, originalFilename).then((file) => {
        const uploader = resolveUploader(type, file)
        if (uploader) {
          uploadWith(uploader, file, {label, title, description, creditLine, source})
        }
      })
      break
    default: {
      throw new Error('Invalid value returned from asset source plugin')
    }
  }
}
