import {Card, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {activeASAPRelease} from '../../../../releases/__fixtures__/release.fixture'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {type ReleaseLaneSegment} from '../releaseLane'
import {VariantReleaseLane} from '../VariantReleaseLane'

const SUMMER_RELEASE = {
  ...activeASAPRelease,
  _id: '_.releases.rSummer',
  metadata: {...activeASAPRelease.metadata, title: 'Summer launch'},
}

const {title: _untitledTitle, ...untitledMetadata} = activeASAPRelease.metadata
const UNTITLED_RELEASE = {
  ...activeASAPRelease,
  _id: '_.releases.rUntitled',
  metadata: untitledMetadata,
}

const SEGMENTS: ReleaseLaneSegment[] = [
  {id: 'published', kind: 'published', count: 4},
  {id: 'drafts', kind: 'drafts', count: 2},
  {id: SUMMER_RELEASE._id, kind: 'release', release: SUMMER_RELEASE, count: 1},
]

const UNTITLED_SEGMENTS: ReleaseLaneSegment[] = [
  {id: 'published', kind: 'published', count: 1},
  {id: UNTITLED_RELEASE._id, kind: 'release', release: UNTITLED_RELEASE, count: 1},
]

/**
 * Chromatic sentinel for the variant-detail release-lane tabs after the ui5
 * Flex migration. Selected published uses the positive tab tone, a named
 * release uses primary, drafts stay default. Counts and untitled fallback
 * copy are fixtures — no live releases store.
 */
export function VariantReleaseLaneStory() {
  return (
    <TestWrapper i18nBundles={[variantsUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              all selected
            </Text>
            <VariantReleaseLane
              activeLane="all"
              onSelectLane={noop}
              segments={SEGMENTS}
              totalCount={5}
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              published selected
            </Text>
            <VariantReleaseLane
              activeLane="published"
              onSelectLane={noop}
              segments={SEGMENTS}
              totalCount={5}
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              drafts selected
            </Text>
            <VariantReleaseLane
              activeLane="drafts"
              onSelectLane={noop}
              segments={SEGMENTS}
              totalCount={5}
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              named release selected
            </Text>
            <VariantReleaseLane
              activeLane={SUMMER_RELEASE._id}
              onSelectLane={noop}
              segments={SEGMENTS}
              totalCount={5}
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              untitled release selected
            </Text>
            <VariantReleaseLane
              activeLane={UNTITLED_RELEASE._id}
              onSelectLane={noop}
              segments={UNTITLED_SEGMENTS}
              totalCount={2}
            />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
