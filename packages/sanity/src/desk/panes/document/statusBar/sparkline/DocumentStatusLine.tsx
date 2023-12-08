import {Box, Flex, Text} from '@sanity/ui'
import React from 'react'
import {Tooltip} from '../../../../../ui'
import {DocumentStatus} from '../../../../../ui/documentStatus'
import {EditStateFor, useDocumentStatus} from 'sanity'

interface DocumentStatusLineProps {
  collapsed?: boolean
  editState: EditStateFor | null
}

export function DocumentStatusLine({collapsed, editState}: DocumentStatusLineProps) {
  const statusTimeAgo = useDocumentStatus({
    draft: editState?.draft,
    hidePublishedDate: collapsed,
    published: editState?.published,
  })

  const statusAbsolute = useDocumentStatus({
    absoluteDate: true,
    draft: editState?.draft,
    published: editState?.published,
  })

  if (!editState) {
    return null
  }

  return (
    <Tooltip content={statusAbsolute}>
      <Flex align="center" gap={3} paddingLeft={1} paddingY={2}>
        <DocumentStatus
          draft={editState?.draft}
          published={editState?.published}
          showPublishedIcon
        />
        <Box flex={1}>
          <Text muted textOverflow="ellipsis" size={1} weight="medium">
            {statusTimeAgo}
          </Text>
        </Box>
      </Flex>
    </Tooltip>
  )
}
