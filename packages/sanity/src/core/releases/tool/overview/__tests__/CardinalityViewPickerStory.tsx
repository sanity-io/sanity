import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {activeCardinalityOneRelease} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {CardinalityViewPicker} from '../CardinalityViewPicker'

const NOOP = () => () => undefined

/**
 * Chromatic sentinel for the releases overview view picker after the ui5 Flex
 * migration. Label-only (releases or drafts) vs the bleed MenuButton when both
 * tools are enabled — icon/text alignment TypeScript will not catch. Copy
 * comes from the releases locale bundle.
 */
export function CardinalityViewPickerStory() {
  return (
    <TestWrapper i18nBundles={[releasesUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              releases label
            </Text>
            <CardinalityViewPicker
              allReleases={[]}
              cardinalityView="releases"
              isDraftModelEnabled={false}
              isReleasesEnabled
              isScheduledDraftsEnabled={false}
              loading={false}
              onCardinalityViewChange={NOOP}
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              drafts label
            </Text>
            <CardinalityViewPicker
              allReleases={[]}
              cardinalityView="drafts"
              isDraftModelEnabled
              isReleasesEnabled={false}
              isScheduledDraftsEnabled
              loading={false}
              onCardinalityViewChange={NOOP}
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              both menu
            </Text>
            <CardinalityViewPicker
              allReleases={[activeCardinalityOneRelease]}
              cardinalityView="releases"
              isDraftModelEnabled
              isReleasesEnabled
              isScheduledDraftsEnabled
              loading={false}
              onCardinalityViewChange={NOOP}
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              both menu loading
            </Text>
            <CardinalityViewPicker
              allReleases={[activeCardinalityOneRelease]}
              cardinalityView="drafts"
              isDraftModelEnabled
              isReleasesEnabled
              isScheduledDraftsEnabled
              loading
              onCardinalityViewChange={NOOP}
            />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
