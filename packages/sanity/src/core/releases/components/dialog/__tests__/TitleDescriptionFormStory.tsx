import {type EditableReleaseDocument} from '@sanity/client'
import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {activeASAPRelease, archivedScheduledRelease} from '../../../__fixtures__/release.fixture'
import {TitleDescriptionForm} from '../TitleDescriptionForm'

const NOOP = () => undefined

const emptyRelease: EditableReleaseDocument = {
  ...activeASAPRelease,
  metadata: {
    ...activeASAPRelease.metadata,
    title: '',
    description: '',
  },
}

const archivedRelease: EditableReleaseDocument = {
  ...archivedScheduledRelease,
  metadata: {
    ...archivedScheduledRelease.metadata,
    description: '',
  },
}

/**
 * Chromatic sentinel for the release title/description fields after the
 * ui5 VStack migration. Theme-token textareas pair placeholder, filled,
 * disabled, and archived-read-only states — a mix TypeScript will not
 * catch. Fixture copy only; no live release store.
 */
export function TitleDescriptionFormStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              placeholders
            </Text>
            <TitleDescriptionForm onChange={NOOP} release={emptyRelease} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              filled
            </Text>
            <TitleDescriptionForm onChange={NOOP} release={activeASAPRelease} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              disabled
            </Text>
            <TitleDescriptionForm disabled onChange={NOOP} release={activeASAPRelease} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              archived read-only
            </Text>
            <TitleDescriptionForm onChange={NOOP} release={archivedRelease} />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
