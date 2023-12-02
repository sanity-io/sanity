import {Box, Flex, Text, useToast} from '@sanity/ui'
import React from 'react'
import {SchemaType} from '@sanity/types'
import {sortBy} from 'lodash'
import styled from 'styled-components'
import {FileLike, ResolvedUploader, UploaderResolver} from '../../../../studio/uploads/types'
import {FileInfo, fileTarget} from '../../../common/fileTarget'
import {DropMessage} from '../../../files/common/DropMessage'
import {UploadEvent} from '../../../../types'
import {FIXME} from '../../../../../FIXME'
import {useTranslation} from '../../../../../i18n'
import {Overlay} from './styles'

export interface UploadTargetProps {
  types: SchemaType[]
  resolveUploader?: UploaderResolver<FIXME>
  onUpload?: (event: UploadEvent) => void
  children?: React.ReactNode
}

// todo: define and export this as a core interface in this package
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
export function uploadTarget<Props>(Component: React.ComponentType<Props>) {
  const FileTarget = fileTarget<FIXME>(Component)

  return React.forwardRef(function UploadTarget(
    props: UploadTargetProps & Props,
    forwardedRef: React.ForwardedRef<HTMLElement>,
  ) {
    const {children, resolveUploader, onUpload, types, ...rest} = props
    const {push: pushToast} = useToast()
    const {t} = useTranslation()

    const uploadFile = React.useCallback(
      (file: File, resolvedUploader: ResolvedUploader) => {
        const {type, uploader} = resolvedUploader
        onUpload?.({file, schemaType: type, uploader})
      },
      [onUpload],
    )

    const handleFiles = React.useCallback(
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
              <Flex key={i} padding={2}>
                <Box marginLeft={1}>
                  <Text weight="medium">{task.file.name}</Text>
                </Box>
                <Box paddingLeft={2}>
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

    const [hoveringFiles, setHoveringFiles] = React.useState<FileInfo[]>([])
    const handleFilesOut = React.useCallback(() => setHoveringFiles([]), [])

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
