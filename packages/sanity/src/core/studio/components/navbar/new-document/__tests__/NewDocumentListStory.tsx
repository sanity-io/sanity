import {Card, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {NewDocumentList} from '../NewDocumentList'

const EMPTY_OPTIONS: [] = []
const LIST_FRAME = {height: 160}

/**
 * Chromatic sentinel for the new-document list empty chrome after the
 * vanilla-extract min-height Flex landed. Empty vs no-results pair
 * centered muted Text with that Flex — a mix TypeScript will not catch.
 * Skip the CommandList and loading paths (virtual list + animated
 * spinner). Copy is from the studio locale bundle (fixture query).
 */
export function NewDocumentListStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              no document types
            </Text>
            <Card border style={LIST_FRAME}>
              <NewDocumentList
                currentUser={null}
                loading={false}
                onDocumentClick={noop}
                options={EMPTY_OPTIONS}
                preview="inline"
                searchQuery=""
                textInputElement={null}
              />
            </Card>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              no search results
            </Text>
            <Card border style={LIST_FRAME}>
              <NewDocumentList
                currentUser={null}
                loading={false}
                onDocumentClick={noop}
                options={EMPTY_OPTIONS}
                preview="inline"
                searchQuery="xyzzy"
                textInputElement={null}
              />
            </Card>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
