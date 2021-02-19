import {Box, Flex, Text, useToast} from '@sanity/ui'
import React from 'react'
import {SchemaType} from '@sanity/types'
import {sortBy} from 'lodash'
// todo: define this as a core interface in this package (e.g. import from src/types.ts or similar instead of the sanity folder)
import styled from 'styled-components'
import {ResolvedUploader, Uploader} from '../../../../sanity/uploads/types'
import {FileInfo, fileTarget} from '../../../common/fileTarget'
import {Overlay} from './styles'

type UploadTargetProps = {
  getUploadOptions: (file: File) => ResolvedUploader[]
  onUpload?: (event: {type: SchemaType; file: File; uploader: Uploader}) => void
  children?: React.ReactNode
}

type UploadTask = {
  file: File
  uploaderCandidates: ResolvedUploader[]
}

const Root = styled.div`
  position: relative;
`

export function uploadTarget<Props>(Component: React.ComponentType<Props>) {
  const FileTarget = fileTarget<any>(Component)

  return React.forwardRef(function UploadTarget(
    props: UploadTargetProps & Props,
    forwardedRef: React.ForwardedRef<HTMLElement>
  ) {
    const {children, getUploadOptions, onUpload, ...rest} = props
    const {push: pushToast} = useToast()

    const uploadFile = React.useCallback(
      (file: File, resolvedUploader: ResolvedUploader) => {
        const {type, uploader} = resolvedUploader
        onUpload?.({file, type, uploader})
      },
      [onUpload]
    )

    const handleFiles = React.useCallback(
      (files: File[]) => {
        const tasks: UploadTask[] = files.map((file) => ({
          file,
          uploaderCandidates: getUploadOptions(file),
        }))
        const ready = tasks.filter((task) => task.uploaderCandidates.length > 0)
        const rejected: UploadTask[] = tasks.filter((task) => task.uploaderCandidates.length === 0)

        if (rejected.length > 0) {
          const plural = rejected.length > 1
          pushToast({
            closable: true,
            status: 'warning',
            title: `The following item${
              plural ? 's' : ''
            } can't be uploaded because there's no known conversion from content type${
              plural ? 's' : ''
            } to array item:`,
            description: rejected.map((task, i) => (
              <Flex key={i} padding={2}>
                <Box marginLeft={1}>
                  <Text weight="semibold">{task.file.name}</Text>
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
            sortBy(task.uploaderCandidates, (candidate) => candidate.uploader.priority)[0]
          )
        })
      },
      [pushToast, getUploadOptions, uploadFile]
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
          {hoveringFiles.length > 0 && (
            <Overlay>
              <Text>Drop to upload</Text>
            </Overlay>
          )}
          {children}
        </FileTarget>
      </Root>
    )
  })
}
