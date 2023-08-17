import {AssetFromSource, FileSchemaType} from '@sanity/types'
import {FIXME} from '../../../../FIXME'
import {FormPatch, PatchEvent, set, setIfMissing, unset} from '../../../patch'
import {Uploader, UploaderResolver, UploadOptions} from '../../../studio/uploads/types'
import {base64ToFile, urlToFile} from '../ImageInput/utils/image'

// We alias DOM File type here to distinguish it from the type of the File value
type DOMFile = globalThis.File

interface Props {
  assetFromSource: AssetFromSource[]
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void
  type: FileSchemaType
  resolveUploader: UploaderResolver
  uploadWith: (uploader: Uploader, file: DOMFile, assetDocumentProps?: UploadOptions) => void
  isImage?: boolean
}

export function handleSelectAssetFromSource({
  assetFromSource,
  onChange,
  type,
  resolveUploader,
  uploadWith,
  isImage,
}: Props): void {
  // const {onChange, type, resolveUploader} = this.props
  if (!assetFromSource) {
    throw new Error('No asset given')
  }
  if (!Array.isArray(assetFromSource) || assetFromSource.length === 0) {
    throw new Error('Returned value must be an array with at least one item (asset)')
  }
  const firstAsset = assetFromSource[0]
  const assetProps = firstAsset.assetDocumentProps
  const originalFilename = assetProps?.originalFilename
  const label = assetProps?.label
  const title = assetProps?.title
  const description = assetProps?.description
  const creditLine = assetProps?.creditLine
  const source = assetProps?.source
  const imagePatches = isImage ? [unset(['hotspot']), unset(['crop'])] : []
  switch (firstAsset.kind) {
    case 'assetDocumentId':
      onChange([
        setIfMissing({
          _type: type.name,
        }),
        ...imagePatches,
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
