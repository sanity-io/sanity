import React from 'react'

import {BinaryDocumentIcon, AccessDeniedIcon, ImageIcon, ReadOnlyIcon} from '@sanity/icons'
import {Flex, Text} from '@sanity/ui'
import {FileLike} from '../../../sanity/uploads/types'

interface Props {
  readOnly: boolean | null
  hoveringFiles: FileLike[]
  type: string
  acceptedFiles: FileLike[]
  rejectedFilesCount: number
  directUploads: boolean
}

export function PlaceholderText(props: Props) {
  const {hoveringFiles, type, readOnly, acceptedFiles, rejectedFilesCount, directUploads} = props
  const isFileType = type === 'file'

  function MessageIcon() {
    if (readOnly) {
      return <ReadOnlyIcon />
    }

    if ((hoveringFiles && rejectedFilesCount > 0) || !directUploads) {
      return <AccessDeniedIcon />
    }

    return isFileType ? <BinaryDocumentIcon /> : <ImageIcon />
  }

  function MessageText() {
    let message = `Drag or paste ${type} here`

    if (!directUploads) {
      message = `Can't upload files here`
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

    return (
      <Text size={1} muted>
        {message}
      </Text>
    )
  }

  return (
    <>
      <Flex justify="center">
        <Text muted>
          <MessageIcon />
        </Text>
      </Flex>
      <Flex justify="center">
        <MessageText />
      </Flex>
    </>
  )
}
