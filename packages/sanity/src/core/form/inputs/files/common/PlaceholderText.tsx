import React, {useMemo} from 'react'
import {BinaryDocumentIcon, AccessDeniedIcon, ImageIcon, ReadOnlyIcon} from '@sanity/icons'
import {Flex, Text} from '@sanity/ui'
import styled from 'styled-components'
import {FileLike} from '../../../studio/uploads/types'

interface Props {
  readOnly?: boolean
  hoveringFiles: FileLike[]
  type: string
  acceptedFiles: FileLike[]
  rejectedFilesCount: number
  directUploads?: boolean
}

const RootFlex = styled(Flex)`
  pointer-events: none;
`

export function PlaceholderText(props: Props) {
  const {hoveringFiles, type, readOnly, acceptedFiles, rejectedFilesCount, directUploads} = props
  const isFileType = type === 'file'

  const messageIcon = useMemo(() => {
    if (readOnly) {
      return <ReadOnlyIcon />
    }

    if ((hoveringFiles && rejectedFilesCount > 0) || !directUploads) {
      return <AccessDeniedIcon />
    }

    return isFileType ? <BinaryDocumentIcon /> : <ImageIcon />
  }, [directUploads, hoveringFiles, isFileType, readOnly, rejectedFilesCount])

  const messageText = useMemo(() => {
    let message = `Drag or paste ${type} here`

    if (!directUploads) {
      return `Can't upload files here`
    }

    if (readOnly) {
      message = 'Read only'
    }

    if (hoveringFiles && directUploads && !readOnly) {
      if (acceptedFiles.length > 0) {
        message = `Drop to upload ${type}`
      }
      if (rejectedFilesCount > 0) {
        message = `Can't upload ${rejectedFilesCount} file${rejectedFilesCount > 1 ? 's' : ''} here`
      }
    }

    return message
  }, [acceptedFiles.length, directUploads, hoveringFiles, readOnly, rejectedFilesCount, type])

  return (
    <RootFlex align="center" gap={2} justify="center">
      <Text muted>{messageIcon}</Text>

      <Text size={1} muted>
        {messageText}
      </Text>
    </RootFlex>
  )
}
