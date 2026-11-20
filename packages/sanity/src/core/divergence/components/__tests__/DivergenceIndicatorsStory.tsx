import {Card} from '@sanity/ui'
import {Flex, Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type DivergenceNavigator, type ReachableDivergence} from '../../divergenceNavigator'
import {type Divergence} from '../../readDocumentDivergences'
import {DivergenceCollectionIndicator} from '../DivergenceCollectionIndicator'
import {DivergenceIndicator} from '../DivergenceIndicator'

const NOOP = () => undefined

const BASE_DIVERGENCE: Divergence = {
  path: 'title',
  effect: 'set',
  documentId: 'upstream-doc',
  documentType: 'article',
  subjectId: 'drafts.doc-1',
  sinceRevisionId: 'upstream-doc@rev-1',
  isAddressable: true,
  status: 'unresolved',
  snapshots: {
    subjectHead: undefined,
    upstreamHead: undefined,
    upstreamAtFork: undefined,
  },
}

const DIVERGENCE: ReachableDivergence = {
  ...BASE_DIVERGENCE,
  isComposite: false,
  divergences: [['title', BASE_DIVERGENCE]],
  schemaType: {name: 'string', jsonType: 'string'},
}

function navigator(focusedDivergence: string | undefined): DivergenceNavigator {
  return {
    focusDivergence: NOOP,
    blurDivergence: NOOP,
    blurFocusedDivergence: NOOP,
    state: {
      focusedDivergence,
      previousDivergence: undefined,
      nextDivergence: undefined,
      state: 'ready',
      upstreamId: 'upstream-doc',
      allDivergences: [['title', BASE_DIVERGENCE]],
      divergences: [['title', DIVERGENCE]],
      divergencesByNode: {title: 1},
    },
  }
}

const UNFOCUSED = navigator(undefined)
const FOCUSED = navigator('title')

/**
 * Chromatic sentinel for field-gutter divergence pills after the mixed ui5 /
 * Sanity UI Button migration: collection vs single, published (positive) vs
 * named-version (suggest) tones, and the selected/focused bleed state.
 * Tooltips stay closed. Copy is a fixture (no live documents).
 */
export function DivergenceIndicatorsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              collection published
            </Text>
            <DivergenceCollectionIndicator
              divergenceCount={3}
              upstreamBundle="published"
              upstreamId="doc-1"
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              collection named version
            </Text>
            <DivergenceCollectionIndicator
              divergenceCount={1}
              upstreamBundle="Summer"
              upstreamId="drafts.doc-1"
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              single unfocused / focused / named
            </Text>
            <Flex alignItems="center" gap={3}>
              <DivergenceIndicator
                divergence={DIVERGENCE}
                divergenceNavigator={UNFOCUSED}
                upstreamBundle="published"
              />
              <DivergenceIndicator
                divergence={DIVERGENCE}
                divergenceNavigator={FOCUSED}
                upstreamBundle="published"
              />
              <DivergenceIndicator
                divergence={DIVERGENCE}
                divergenceNavigator={UNFOCUSED}
                upstreamBundle="Summer"
              />
            </Flex>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
