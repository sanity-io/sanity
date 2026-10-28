import {type ReleaseDocument} from '@sanity/client'
import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {activeScheduledRelease} from '../../../releases/__fixtures__/release.fixture'
import {type TargetPerspective} from '../../types'
import {CurrentGlobalPerspectiveLabel} from '../currentGlobalPerspectiveLabel'

const LONG_TITLE_RELEASE: ReleaseDocument = {
  ...activeScheduledRelease,
  _id: '_.releases.rLongTitle',
  name: 'rLongTitle',
  metadata: {
    ...activeScheduledRelease.metadata,
    title: 'Spring campaign launch across every regional storefront',
  },
}

const STATES: {label: string; perspective: TargetPerspective}[] = [
  {label: 'published', perspective: 'published'},
  {label: 'drafts', perspective: 'drafts'},
  {label: 'release', perspective: activeScheduledRelease},
  {label: 'release, truncated title', perspective: LONG_TITLE_RELEASE},
  {label: 'agent bundle', perspective: 'agent-story'},
]

/**
 * Chromatic sentinel for the navbar's current perspective label: the medium size-1 text of the
 * system perspectives and agent bundles, and the release link button with its 180px truncation.
 */
export function CurrentGlobalPerspectiveLabelStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 320}}>
        <VStack gap={4}>
          {STATES.map(({label, perspective}) => (
            <VStack key={label} gap={2}>
              <Text muted size={1} weight="medium">
                {label}
              </Text>
              <div>
                <CurrentGlobalPerspectiveLabel selectedPerspective={perspective} />
              </div>
            </VStack>
          ))}
        </VStack>
      </Card>
    </TestWrapper>
  )
}
