// This upload target is similar to the one in files/input, but uses resolveUploader instead of resolveUploadAssetSources
// in order to keep backwards compatibility with existing uploaders and custom upload implementations.
import {AccessDeniedIcon, UploadIcon} from '@sanity/icons'
import {type SchemaType} from '@sanity/types'
import {Box, Card, Flex, Inline, Layer, Text, useToast} from '@sanity/ui'
import {sortBy} from 'lodash-es'
import {
  type ComponentType,
  type ForwardedRef,
  forwardRef,
  type ForwardRefExoticComponent,
  type PropsWithoutRef,
  type ReactNode,
  type RefAttributes,
  useCallback,
  useState,
} from 'react'
import {styled} from 'styled-components'

import {type FIXME} from '../../../../FIXME'
import {useTranslation} from '../../../../i18n'
import {withFocusRing} from '../../../components/withFocusRing'
import {
  type FileLike,
  type ResolvedUploader,
  type UploaderResolver,
} from '../../../studio/uploads/types'
import {type UploadEvent} from '../../../types'
import {type FileInfo, fileTarget} from '../../files/common/fileTarget'

export interface UploadTargetProps {
  types: SchemaType[]
  resolveUploader?: UploaderResolver<FIXME>
  onUpload?: (event: UploadEvent) => void
  children?: ReactNode
}

interface UploadTask {
  file: File
  uploaderCandidates: ResolvedUploader[]
}

const Root = styled.div`
  position: relative;
`

function getUploadCandidates(
  types: SchemaType[],
  resolveUploader: UploaderResolver,
  file: FileLike,
) {
  return types
    .map((memberType) => ({
      type: memberType,
      uploader: resolveUploader(memberType, file),
    }))
    .filter((member) => member.uploader) as ResolvedUploader[]
}

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
    const {children, resolveUploader, onUpload, types, ...rest} = props
    const {push: pushToast} = useToast()
    const {t} = useTranslation()

    const uploadFile = useCallback(
      (file: File, resolvedUploader: ResolvedUploader) => {
        const {type, uploader} = resolvedUploader
        onUpload?.({file, schemaType: type, uploader})
      },
      [onUpload],
    )

    const handleFiles = useCallback(
      (files: File[]) => {
        if (!resolveUploader) {
          return
        }
        const tasks: UploadTask[] = files.map((file) => ({
          file,
          uploaderCandidates: getUploadCandidates(types, resolveUploader, file),
        }))
        const ready = tasks.filter((task) => task.uploaderCandidates.length > 0)
        const rejected: UploadTask[] = tasks.filter((task) => task.uploaderCandidates.length === 0)

        if (rejected.length > 0) {
          pushToast({
            closable: true,
            status: 'warning',
            title: t('inputs.array.error.cannot-upload-unable-to-convert', {
              count: rejected.length,
            }),
            description: rejected.map((task, i) => (
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
        }

        // todo: consider if we should to ask the user here
        // the list of candidates is sorted by their priority and the first one is selected
        // const ambiguous = tasks
        //   .filter(task => task.uploaderCandidates.length > 1)
        ready.forEach((task) => {
          uploadFile(
            task.file,
            // eslint-disable-next-line max-nested-callbacks
            sortBy(task.uploaderCandidates, (candidate) => candidate.uploader.priority)[0],
          )
        })
      },
      [pushToast, resolveUploader, types, uploadFile, t],
    )

    const [hoveringFiles, setHoveringFiles] = useState<FileInfo[]>([])
    const handleFilesOut = useCallback(() => setHoveringFiles([]), [])

    return (
      <Root>
        <FileTarget
          {...rest}
          ref={forwardedRef}
          onFiles={handleFiles}
          onFilesOver={setHoveringFiles}
          onFilesOut={handleFilesOut}
        >
          {resolveUploader && hoveringFiles.length > 0 && (
            <Overlay zOffset={10}>
              <DropMessage
                hoveringFiles={hoveringFiles}
                types={types}
                resolveUploader={resolveUploader}
              />
            </Overlay>
          )}
          {children}
        </FileTarget>
      </Root>
    )
  })
}

const StyledCard = styled(Card)`
  height: 100%;
`

export const UploadTargetCard = withFocusRing(uploadTarget(StyledCard))

export const Overlay = styled(Layer)`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background-color: var(--card-bg-color);
  opacity: 0.8;
`

interface DropMessageProps {
  hoveringFiles: FileLike[]
  types: SchemaType[]
  resolveUploader: UploaderResolver
}

function DropMessage(props: DropMessageProps) {
  const {hoveringFiles, types, resolveUploader} = props
  const acceptedFiles = hoveringFiles.filter((file) =>
    types.some((type) => resolveUploader(type, file)),
  )
  const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length
  const multiple = types.length > 1
  const {t} = useTranslation()
  return (
    <>
      {acceptedFiles.length > 0 ? (
        <>
          <Inline space={2}>
            <Text>
              <UploadIcon />
            </Text>
            {multiple
              ? t('inputs.files.common.drop-message.drop-to-upload-multi', {
                  count: acceptedFiles.length,
                })
              : t('inputs.files.common.drop-message.drop-to-upload')}
            <Text />
          </Inline>
          {rejectedFilesCount > 0 && (
            <Box marginTop={4}>
              <Inline space={2}>
                <Text muted size={1}>
                  <AccessDeniedIcon />
                </Text>
                <Text muted size={1}>
                  {t('inputs.files.common.drop-message.drop-to-upload.rejected-file-message', {
                    count: rejectedFilesCount,
                  })}
                </Text>
              </Inline>
            </Box>
          )}
        </>
      ) : (
        <Inline space={2}>
          <Text>
            <AccessDeniedIcon />
          </Text>
          <Text>
            {t('inputs.files.common.drop-message.drop-to-upload.no-accepted-file-message', {
              count: hoveringFiles.length,
            })}
          </Text>
        </Inline>
      )}
    </>
  )
}
