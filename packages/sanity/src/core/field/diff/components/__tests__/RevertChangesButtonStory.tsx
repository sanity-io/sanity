import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {RevertChangesButton} from '../RevertChangesButton'

const NOOP = () => undefined

/**
 * Chromatic sentinel for the review-changes revert control after the
 * styled-components hover rule (critical ink, label Box hidden until
 * hover/focus). Default snapshots stay hover-free so only the icon shows;
 * the Hover story parks the pointer on a single button so the label
 * appears. Copy comes from the studio locale (`Revert change` /
 * `Revert changes`).
 */
export function RevertChangesButtonStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              one change
            </Text>
            <RevertChangesButton changeCount={1} onClick={NOOP} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              several changes
            </Text>
            <RevertChangesButton changeCount={4} onClick={NOOP} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              selected
            </Text>
            <RevertChangesButton changeCount={1} onClick={NOOP} selected />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              disabled
            </Text>
            <RevertChangesButton changeCount={1} disabled onClick={NOOP} />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}

/**
 * Single revert control so a play hover can reveal the hidden label Box
 * without a pointer sitting on the States grid.
 */
export function RevertChangesButtonHoverStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360, minHeight: 120}}>
        <RevertChangesButton changeCount={1} onClick={NOOP} />
      </Card>
    </TestWrapper>
  )
}
