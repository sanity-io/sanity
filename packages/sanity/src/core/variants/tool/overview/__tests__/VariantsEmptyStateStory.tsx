import {Card, Stack, Text} from '@sanity/ui'
import {Flex} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {Button} from '../../../../../ui-components/button/Button'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {VariantsEmptyState} from '../VariantsEmptyState'

/**
 * Chromatic sentinel for the variants overview empty state after the ui5
 * Flex migration. Centered illustration, heading, muted copy, and the
 * optional create-button slot all depend on Flex gap/alignment — a spacing
 * drift TypeScript will not catch. Each state sits in a centered flex
 * parent, matching the TableEmptyState cell that mounts it in production.
 * Illustration is inline SVG (no network).
 */
export function VariantsEmptyStateStory() {
  return (
    <TestWrapper i18nBundles={[variantsUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              docs link only
            </Text>
            <Flex justifyContent="center">
              <VariantsEmptyState />
            </Flex>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              with create action
            </Text>
            <Flex justifyContent="center">
              <VariantsEmptyState createVariantButton={<Button text="Create variant" />} />
            </Flex>
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
