import React from 'react'
import {SchemaType} from '@sanity/types'

import {
  BinaryDocumentIcon,
  AccessDeniedIcon,
  SearchIcon,
  ImageIcon,
  ReadOnlyIcon,
} from '@sanity/icons'
import {Flex, Text, Button, Inline, Stack} from '@sanity/ui'
import {FileLike, UploaderResolver} from '../../../sanity/uploads/types'

interface Props {
  readOnly: boolean | null
  hoveringFiles: FileLike[]
  type: string
  acceptedFiles: FileLike[]
  rejectedFilesCount: number
}

export function PlaceholderText(props: Props) {
  const {hoveringFiles, type, readOnly, acceptedFiles, rejectedFilesCount} = props
  const isFileType = type === 'file'

  function MessageIcon() {
    if (readOnly) {
      return <ReadOnlyIcon />
    }

    if (hoveringFiles) {
      if (rejectedFilesCount > 0) {
        return <AccessDeniedIcon />
      }
    }

    return isFileType ? <BinaryDocumentIcon /> : <ImageIcon />
  }

  function MessageText() {
    let message = `Drag or paste ${type} here`
    if (readOnly) {
      message = 'Read only'
    }

    if (hoveringFiles) {
      if (acceptedFiles.length > 0) {
        message = `Drag ${type} here`
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
