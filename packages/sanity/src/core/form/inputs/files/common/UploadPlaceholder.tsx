import {UploadIcon} from '@sanity/icons'
import {type AssetSource, type SchemaType} from '@sanity/types'
import {Flex, useElementSize} from '@sanity/ui'
import {get} from 'lodash-es'
import {memo, type ReactNode, useCallback, useMemo, useState} from 'react'

import {useSource} from '../../../../../core/studio'
import {useClient} from '../../../../hooks'
import {useTranslation} from '../../../../i18n'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {
  createDatasetFileAssetSource,
  createDatasetImageAssetSource,
} from '../../../studio/assetSourceDataset'
import {type FileLike} from '../../../studio/uploads/types'
import {FileInputButton} from './FileInputButton/FileInputButton'
import {PlaceholderText} from './PlaceholderText'
import {UploadDropDownMenu} from './UploadDropDownMenu'

interface UploadPlaceholderProps {
  assetSources: AssetSource[]
  browse?: ReactNode
  directUploads?: boolean
  hoveringFiles?: FileLike[]
  onUpload?: (assetSource: AssetSource, files: File[]) => void
  readOnly?: boolean
  schemaType: SchemaType
  type: string
}

function UploadPlaceholderComponent(props: UploadPlaceholderProps) {
  const {assetSources, browse, directUploads, hoveringFiles, onUpload, readOnly, schemaType, type} =
    props

  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const rect = useElementSize(rootElement)

  // Adjust the layout in narrow containers
  const collapsed = rect?.border && rect.border.width < 440
  const {t} = useTranslation()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const source = useSource()

  const assetSourcesWithUpload = useMemo(() => {
    const result: AssetSource[] = assetSources.filter((s) => Boolean(s.Uploader))
    // If no asset sources are available, we create a default one to upload to the dataset
    if (result.length === 0) {
      const options = {
        client,
        title: source.title || source.name,
      }
      const isFileType = type === 'file'
      result.push(
        isFileType ? createDatasetFileAssetSource(options) : createDatasetImageAssetSource(options),
      )
    }
    return result
  }, [assetSources, client, source, type])

  const handleSelectFiles = useCallback(
    (assetSource: AssetSource, files: File[]) => {
      if (onUpload) {
        onUpload(assetSource, files)
      }
    },
    [onUpload],
  )

  const accept = get(schemaType, 'options.accept', '')

  const uploadButton = useMemo(() => {
    switch (assetSourcesWithUpload.length) {
      case 0:
        return null
      case 1:
        return (
          <FileInputButton
            accept={accept}
            data-testid={`file-input-upload-button-${assetSourcesWithUpload[0].name}`}
            disabled={readOnly || directUploads === false}
            icon={UploadIcon}
            mode="bleed"
            onSelect={(files) => {
              if (onUpload) {
                onUpload(assetSourcesWithUpload[0], files)
              }
            }}
            text={t('input.files.common.upload-placeholder.file-input-button.text')}
          />
        )
      default:
        return (
          <UploadDropDownMenu
            accept={accept}
            assetSources={assetSourcesWithUpload}
            directUploads={directUploads}
            onSelectFiles={handleSelectFiles}
            readOnly={readOnly}
          />
        )
    }
  }, [accept, assetSourcesWithUpload, directUploads, handleSelectFiles, onUpload, readOnly, t])

  return assetSourcesWithUpload.length === 0 ? null : (
    <Flex
      align={collapsed ? undefined : 'center'}
      direction={collapsed ? 'column' : 'row'}
      gap={4}
      justify="space-between"
      paddingY={collapsed ? 1 : undefined}
      ref={setRootElement}
    >
      <Flex flex={1}>
        <PlaceholderText
          directUploads={directUploads}
          hoveringFiles={hoveringFiles}
          readOnly={readOnly}
          type={type}
        />
      </Flex>

      <Flex align="center" gap={1} justify="center" wrap="wrap">
        {uploadButton}
        {browse}
      </Flex>
    </Flex>
  )
}

export const UploadPlaceholder = memo(UploadPlaceholderComponent)
