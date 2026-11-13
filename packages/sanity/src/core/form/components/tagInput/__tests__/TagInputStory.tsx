import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {TagInput} from '../tagInput'

const NOOP = () => undefined

const TAGS = [{value: 'Robert De Niro'}, {value: 'Al Pacino'}]
const LONG_TAG = [{value: 'A very long tag value that should ellipsize in the pill'}]

/**
 * Chromatic sentinel for the tags array input after the ui5 Flex/Box
 * migration of the pill chrome. Empty placeholder, populated pills, and
 * readOnly/disabled (no remove button — padding is left-only and has
 * drifted before). TypeScript will not catch Card focus-ring vs pill
 * alignment. Placeholder copy is studio i18n.
 */
export function TagInputStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              empty
            </Text>
            <TagInput onChange={NOOP} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              tags
            </Text>
            <TagInput onChange={NOOP} value={TAGS} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              read only
            </Text>
            <TagInput onChange={NOOP} readOnly value={TAGS} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              disabled
            </Text>
            <TagInput disabled onChange={NOOP} value={TAGS} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              ellipsis
            </Text>
            <TagInput onChange={NOOP} readOnly value={LONG_TAG} />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
