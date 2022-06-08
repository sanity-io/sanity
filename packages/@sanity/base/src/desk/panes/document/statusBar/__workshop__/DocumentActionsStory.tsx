import {Container, Flex} from '@sanity/ui'
import React, {useMemo} from 'react'
import {DeskToolProvider} from '../../../../DeskToolProvider'
import {DocumentPaneNode} from '../../../../types'
import {DocumentPaneProvider} from '../../DocumentPaneProvider'
import {DocumentStatusBarActions} from '../DocumentStatusBarActions'

export default function DocumentActionsStory() {
  const pane: DocumentPaneNode = useMemo(
    () => ({
      type: 'document',
      id: 'grrm',
      title: 'grrm',
      options: {
        type: 'author',
        id: 'grrm',
      },
    }),
    []
  )

  return (
    <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
      <Container width={0}>
        <DeskToolProvider>
          <DocumentPaneProvider index={1} itemId="test" pane={pane} paneKey="test">
            <DocumentStatusBarActions />
          </DocumentPaneProvider>
        </DeskToolProvider>
      </Container>
    </Flex>
  )
}
