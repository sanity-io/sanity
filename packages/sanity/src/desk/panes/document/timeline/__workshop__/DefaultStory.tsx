import React, {useMemo} from 'react'
import {Box, Card, Inline, Stack, Text} from '@sanity/ui'
import {DeskToolProvider} from '../../../../DeskToolProvider'
import type {DocumentPaneNode} from '../../../../types'
import {DocumentPaneProvider} from '../../DocumentPaneProvider'
import {TimelineMenu} from '../timelineMenu'

const DOCUMENT_ID = 'test'
const DOCUMENT_TYPE = 'author'

export default function DefaultStory() {
  const pane: DocumentPaneNode = useMemo(
    () => ({
      id: DOCUMENT_ID,
      options: {
        id: DOCUMENT_ID,
        type: DOCUMENT_TYPE,
      },
      type: 'document',
      title: 'Workshop',
    }),
    []
  )

  return (
    <DeskToolProvider>
      <DocumentPaneProvider index={0} itemId={DOCUMENT_ID} pane={pane} paneKey={DOCUMENT_ID}>
        <Box padding={2}>
          <Stack space={2}>
            <Card padding={3} shadow={1} tone="primary">
              <Stack space={3}>
                <Inline space={1}>
                  <Text size={1} weight="medium">
                    Document ID:
                  </Text>
                  <Text size={1}>{DOCUMENT_ID}</Text>
                </Inline>
                <Inline space={1}>
                  <Text size={1} weight="medium">
                    Document Type:
                  </Text>
                  <Text size={1}>{DOCUMENT_TYPE}</Text>
                </Inline>
              </Stack>
            </Card>
            <Card padding={2}>
              <TimelineMenu chunk={null} mode="rev" />
            </Card>
          </Stack>
        </Box>
      </DocumentPaneProvider>
    </DeskToolProvider>
  )
}
