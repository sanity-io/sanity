import React from 'react'
import {SchemaType} from '@sanity/types'

import {UploadIcon, AccessDeniedIcon, SearchIcon, ImageIcon, ReadOnlyIcon} from '@sanity/icons'
import {Flex, Text, Button, Inline, Stack} from '@sanity/ui'
import {FileLike, UploaderResolver} from '../../../sanity/uploads/types'

interface Props {
  readOnly: boolean | null
  hoveringFiles: FileLike[]
  types: SchemaType[]
  acceptedFiles: FileLike[]
  rejectedFilesCount: number
}

export function PlaceholderText(props: Props) {
  const {hoveringFiles, types, readOnly, acceptedFiles, rejectedFilesCount} = props

  function MessageIcon() {
    if (readOnly) {
      return <ReadOnlyIcon />
    }

    if (hoveringFiles) {
      if (rejectedFilesCount > 0) {
        return <AccessDeniedIcon />
      }
    }

    return <ImageIcon />
  }

  function MessageText() {
    let message = 'Drag or paste image here'
    if (readOnly) {
      message = 'Read only'
    }

    if (hoveringFiles) {
      if (acceptedFiles.length > 0) {
        message = 'Drag image here'
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
    <Stack space={3}>
      <Flex justify="center">
        <Text muted>
          <MessageIcon />
        </Text>
      </Flex>
      <Flex justify="center">
        <MessageText />
      </Flex>
    </Stack>
  )
}
