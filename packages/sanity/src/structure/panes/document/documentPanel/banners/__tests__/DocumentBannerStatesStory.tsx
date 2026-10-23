import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {PausedScheduledDraftBanner} from '../PausedScheduledDraftBanner'
import {VariantDefinitionNotFoundBanner} from '../VariantDefinitionNotFoundBanner'

/**
 * Chromatic sentinel for document-pane banners that compose the shared Banner
 * with real structure i18n copy. Paused scheduled drafts and a missing
 * variant definition are caution tones + Translate interpolations that the
 * generic Banner grid does not import. TypeScript will not catch icon/tone
 * pairing or wrapping of the variant name.
 */
export function DocumentBannerStatesStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 560}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              paused scheduled draft
            </Text>
            <PausedScheduledDraftBanner />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              variant definition not found
            </Text>
            <VariantDefinitionNotFoundBanner requestedVariantName="summer-sale" />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              variant definition not found wrapping
            </Text>
            <VariantDefinitionNotFoundBanner requestedVariantName="a-very-long-variant-name-that-should-wrap" />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
