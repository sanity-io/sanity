import {Container, Flex} from '@sanity/ui'
import React, {useMemo} from 'react'
import {DeskToolProvider} from '../../../../DeskToolProvider'
import {DocumentPaneNode} from '../../../../types'
import {DocumentPaneProvider} from '../../DocumentPaneProvider'
import {DocumentBadges} from '../sparkline/DocumentBadges'

export default function DocumentBadgesStory() {
  const pane: DocumentPaneNode = useMemo(
    () => ({
      type: 'document',
      id: 'live-thesis',
      title: 'live-thesis',
      options: {
        type: 'thesis',
        id: 'live-thesis',
      },
    }),
    [],
  )

  return (
    <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
      <Container width={0}>
        <DeskToolProvider>
          <DocumentPaneProvider index={1} itemId="test" pane={pane} paneKey="test">
            <DocumentBadges />
          </DocumentPaneProvider>
        </DeskToolProvider>
      </Container>
    </Flex>
  )
}
