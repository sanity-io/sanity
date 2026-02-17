import {type AssetSource, type SchemaType} from '@sanity/types'
import {Box, type CardTone, Flex, Text, useToast} from '@sanity/ui'
import {uniqBy} from 'lodash-es'
import {
  type ComponentType,
  type ForwardedRef,
  forwardRef,
  type ForwardRefExoticComponent,
  type PropsWithoutRef,
  type ReactNode,
  type RefAttributes,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import {styled} from 'styled-components'

import {type FIXME} from '../../../../../FIXME'
import {useClient} from '../../../../../hooks'
import {useTranslation} from '../../../../../i18n'
import {useSource} from '../../../../../studio'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../studioClient'
import {_isType} from '../../../../../util/schemaUtils'
import {
  createDatasetFileAssetSource,
  createDatasetImageAssetSource,
} from '../../../../studio/assetSourceDataset'
import {resolveUploadAssetSources} from '../../../../studio/uploads/resolveUploadAssetSources'
import {type InputOnSelectFileFunctionProps, type UploadEvent} from '../../../../types'
import {useFormBuilder} from '../../../../useFormBuilder'
import {DropMessage} from '../DropMessage'
import {type FileInfo, fileTarget} from '../fileTarget'
import {UploadDestinationPicker} from '../UploadDestinationPicker'
import {Overlay} from './styles'

type FileEntry = {
  file: File
  schemaType: SchemaType | null
  assetSource: AssetSource | null
}

export interface UploadTargetProps {
  types: SchemaType[]
  isReadOnly?: boolean
  onUpload?: (event: UploadEvent) => void
  onSetHoveringFiles?: (files: FileInfo[]) => void
  onSelectFile?: (props: InputOnSelectFileFunctionProps) => void
  pasteTarget?: HTMLElement
  tone?: CardTone
  children?: ReactNode
}

const Root = styled.div`
  position: relative;
`

export function uploadTarget<Props>(
  Component: ComponentType<Props>,
): ForwardRefExoticComponent<
  PropsWithoutRef<UploadTargetProps & Props> & RefAttributes<HTMLElement>
> {
  const FileTarget = fileTarget<FIXME>(Component)

  // @ts-expect-error TODO fix PropsWithoutRef related union typings
  return forwardRef(function UploadTarget(
    props: UploadTargetProps & Props,
    forwardedRef: ForwardedRef<HTMLElement>,
  ) {
    const {
      children,
      isReadOnly,
      onSelectFile,
      onSetHoveringFiles,
      types,
      tone: toneFromProps,
      pasteTarget,
      ...rest
    } = props
    const {push: pushToast} = useToast()
    const {t} = useTranslation()
    const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
    const source = useSource()

    const formBuilder = useFormBuilder()

    // Check if all image/file types in the types array have disableNew: true
    // This centralizes the disableUpload logic so parent components don't need to compute it
    const disableUpload = useMemo(() => {
      const assetTypes = types.filter((type) => _isType(type, 'image') || _isType(type, 'file'))
      // Only disable upload if there are asset types AND all of them have disableNew
      return assetTypes.length > 0 && assetTypes.every((type) => type.options?.disableNew === true)
    }, [types])

    // Create default asset sources with Uploaders for drag-and-drop fallback
    // This mirrors the behavior in UploadPlaceholder.tsx
    const defaultImageAssetSource = useMemo(
      () => createDatasetImageAssetSource({client, title: source.title || source.name}),
      [client, source],
    )
    const defaultFileAssetSource = useMemo(
      () => createDatasetFileAssetSource({client, title: source.title || source.name}),
      [client, source],
    )

    const [filesToUpload, setFilesToUpload] = useState<File[]>([])
    const [showAssetSourceDestinationPicker, setShowAssetSourceDestinationPicker] = useState(false)
    const [tone, setTone] = useState<CardTone>(
      toneFromProps || (isReadOnly ? 'transparent' : 'default'),
    )

    const assetSourceDestinationName = useRef<string | null>(null)

    const alertRejectedFiles = useCallback(
      (rejected: FileEntry[]) => {
        pushToast({
          closable: true,
          status: 'warning',
          title: t('inputs.array.error.cannot-upload-unable-to-convert', {
            count: rejected.length,
          }),
          description: rejected.map((task, i) => (
            // oxlint-disable-next-line no-array-index-key
            <Flex key={i} gap={2} padding={2}>
              <Box>
                <Text weight="medium">{task.file.name}</Text>
              </Box>
              <Box>
                <Text size={1}>({task.file.type})</Text>
              </Box>
            </Flex>
          )),
        })
      },
      [pushToast, t],
    )

    // This is called after the user has dropped or pasted files and selected an asset source destination (if applicable)
    const handleUploadFiles = useCallback(
      (files: File[]) => {
        const filesAndAssetSources = getFilesAndAssetSources({
          files,
          types,
          assetSourceDestinationName: assetSourceDestinationName.current,
          formBuilder,
          defaultImageAssetSource,
          defaultFileAssetSource,
        })

        const ready = filesAndAssetSources.filter((entry) => entry.assetSource !== null)
        const rejected = filesAndAssetSources.filter((entry) => entry.assetSource === null)

        if (rejected.length > 0) {
          alertRejectedFiles(rejected)
        }
        if (onSelectFile) {
          ready.forEach((entry) => {
            onSelectFile({
              assetSource: entry.assetSource!,
              schemaType: entry.schemaType!,
              file: entry.file,
            })
          })
        }
      },
      [
        alertRejectedFiles,
        defaultFileAssetSource,
        defaultImageAssetSource,
        formBuilder,
        onSelectFile,
        types,
      ],
    )

    // This is called when files are dropped or pasted onto the upload target. It may show the asset source destination picker if needed.
    const handleFiles = useCallback(
      (files: File[]) => {
        if (isReadOnly || disableUpload || types.length === 0) {
          return
        }
        const filesAndAssetSources = getFilesAndAssetSources({
          files,
          types,
          assetSourceDestinationName: assetSourceDestinationName.current,
          formBuilder,
          defaultImageAssetSource,
          defaultFileAssetSource,
        })
        const ready = filesAndAssetSources.filter((entry) => entry.assetSource !== null)
        if (ready.length === 0) {
          // Only show warning if there were actual files that couldn't be uploaded
          // (avoid showing warning when pasting plain text which results in empty files array)
          if (filesAndAssetSources.length > 0) {
            alertRejectedFiles(filesAndAssetSources)
          }
          return
        }
        const allAssetSources = types.flatMap(
          (type) => resolveUploadAssetSources?.(type, formBuilder) ?? [],
        )
        const uniqueAssetSources = uniqBy(allAssetSources, 'name')
        if (uniqueAssetSources.length > 1 && assetSourceDestinationName.current === null) {
          setShowAssetSourceDestinationPicker(true)
          setFilesToUpload(files)
          return
        }
        setShowAssetSourceDestinationPicker(false)
        setFilesToUpload([])
        handleUploadFiles(ready.map((entry) => entry.file))
      },
      [
        alertRejectedFiles,
        defaultFileAssetSource,
        defaultImageAssetSource,
        disableUpload,
        formBuilder,
        handleUploadFiles,
        isReadOnly,
        types,
      ],
    )

    const [hoveringFiles, setHoveringFiles] = useState<FileInfo[]>([])

    const handleFilesOver = useCallback(
      (files: FileInfo[]) => {
        if (isReadOnly || disableUpload) {
          return
        }
        setHoveringFiles(files)
        const acceptedFiles = files.filter((file) =>
          // eslint-disable-next-line max-nested-callbacks
          types.some((type) => resolveUploadAssetSources(type, formBuilder, file).length > 0),
        )
        const rejectedFilesCount = files.length - acceptedFiles.length
        if (rejectedFilesCount > 0) {
          setTone('critical')
        } else if (acceptedFiles.length > 0) {
          setTone('primary')
        } else {
          setTone('default')
        }

        if (onSetHoveringFiles) {
          onSetHoveringFiles(files)
        }
      },
      [disableUpload, formBuilder, isReadOnly, onSetHoveringFiles, types],
    )

    const handleFilesOut = useCallback(() => {
      if (isReadOnly || disableUpload) {
        return
      }
      setHoveringFiles([])
      setTone('default')
      if (onSetHoveringFiles) {
        onSetHoveringFiles([])
      }
      setFilesToUpload([])
    }, [disableUpload, isReadOnly, onSetHoveringFiles])

    const allAssetSourcesWithUpload = types.flatMap(
      (type) => resolveUploadAssetSources?.(type, formBuilder) ?? [],
    )
    // Asset sources may be returned for multiple types (file, image), we need to deduplicate them in order to show a unique list
    const assetSourcesWithUploadByName = uniqBy(allAssetSourcesWithUpload, 'name')

    const handleSetAssetSourceDestination = useCallback(
      (assetSource: AssetSource | null) => {
        assetSourceDestinationName.current = assetSource?.name ?? null
        if (filesToUpload.length > 0 && assetSource) {
          handleUploadFiles(filesToUpload)
        }
        setFilesToUpload([])
        setShowAssetSourceDestinationPicker(false)
        assetSourceDestinationName.current = null
      },
      [filesToUpload, handleUploadFiles],
    )

    const handleUploadDestinationPickerClose = useCallback(() => {
      handleFilesOver([])
      setFilesToUpload([])
      setShowAssetSourceDestinationPicker(false)
      assetSourceDestinationName.current = null
    }, [handleFilesOver])

    const uploadDestinationPickerText = t(
      'inputs.files.common.placeholder.select-asset-source-upload-destination',
      {
        context: types.length > 1 ? 'array' : types[0].name,
      },
    )

    return (
      <Root>
        {showAssetSourceDestinationPicker && (
          <UploadDestinationPicker
            assetSources={assetSourcesWithUploadByName}
            onSelectAssetSource={handleSetAssetSourceDestination}
            onClose={handleUploadDestinationPickerClose}
            text={uploadDestinationPickerText}
          />
        )}
        <FileTarget
          {...rest}
          tone={toneFromProps || tone}
          ref={forwardedRef}
          onFiles={handleFiles}
          onFilesOver={handleFilesOver}
          onFilesOut={handleFilesOut}
          pasteTarget={pasteTarget}
        >
          {hoveringFiles.length > 0 && (
            <Overlay zOffset={10}>
              <DropMessage hoveringFiles={hoveringFiles} types={types} />
            </Overlay>
          )}
          {children}
        </FileTarget>
      </Root>
    )
  })
}

/**
 * Resolves an asset source with fallback to the default source when the resolved source
 * lacks an Uploader (e.g., sanity-plugin-media). This enables drag-and-drop for such plugins.
 */
function resolveAssetSourceWithFallback(
  resolvedSource: AssetSource | undefined,
  defaultSource: AssetSource,
): AssetSource | null {
  if (resolvedSource === undefined) {
    return null
  }
  if (resolvedSource.Uploader) {
    return resolvedSource
  }
  return defaultSource
}

function findMatchingAssetSource(
  schemaType: SchemaType | undefined,
  formBuilder: FIXME,
  file: File,
  assetSourceDestinationName: string | null,
): AssetSource | undefined {
  if (schemaType === undefined) {
    return undefined
  }
  return resolveUploadAssetSources(schemaType, formBuilder, file).find(
    (source) => assetSourceDestinationName === null || source.name === assetSourceDestinationName,
  )
}

interface GetFilesAndAssetSourcesOptions {
  files: File[]
  types: SchemaType[]
  assetSourceDestinationName: string | null
  formBuilder: FIXME
  defaultImageAssetSource: AssetSource
  defaultFileAssetSource: AssetSource
}

function getFilesAndAssetSources(options: GetFilesAndAssetSourcesOptions): FileEntry[] {
  const {
    files,
    types,
    assetSourceDestinationName,
    formBuilder,
    defaultImageAssetSource,
    defaultFileAssetSource,
  } = options
  const imageType = types.find((type) => _isType(type, 'image'))
  const fileType = types.find((type) => _isType(type, 'file'))

  return files.map((file) => {
    const resolvedImageSource = findMatchingAssetSource(
      imageType,
      formBuilder,
      file,
      assetSourceDestinationName,
    )
    const imageAssetSource = resolveAssetSourceWithFallback(
      resolvedImageSource,
      defaultImageAssetSource,
    )

    if (imageType && file.type.startsWith('image/') && imageAssetSource) {
      return {
        file,
        schemaType: imageType,
        assetSource: imageAssetSource,
      }
    }

    const resolvedFileSource = findMatchingAssetSource(
      fileType,
      formBuilder,
      file,
      assetSourceDestinationName,
    )
    const fileAssetSource = resolveAssetSourceWithFallback(
      resolvedFileSource,
      defaultFileAssetSource,
    )

    if (fileType && fileAssetSource) {
      return {
        file,
        schemaType: fileType,
        assetSource: fileAssetSource,
      }
    }

    return {
      file,
      schemaType: null,
      assetSource: null,
    }
  })
}
