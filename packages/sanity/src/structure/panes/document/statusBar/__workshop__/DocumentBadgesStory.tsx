import {Container, Flex} from '@sanity/ui'
import {useMemo} from 'react'

import {StructureToolProvider} from '../../../../StructureToolProvider'
import {type DocumentPaneNode} from '../../../../types'
import {DocumentPaneProvider} from '../../DocumentPaneProvider'
import {DocumentBadges} from '../DocumentBadges'

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
        <StructureToolProvider>
          <DocumentPaneProvider index={1} itemId="test" pane={pane} paneKey="test">
            <DocumentBadges />
          </DocumentPaneProvider>
        </StructureToolProvider>
      </Container>
    </Flex>
  )
}
