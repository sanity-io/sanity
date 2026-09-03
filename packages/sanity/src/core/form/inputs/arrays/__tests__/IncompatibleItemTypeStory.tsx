import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {IncompatibleItemType} from '../ArrayOfObjectsInput/List/IncompatibleItemType'

/**
 * Chromatic sentinel for incompatible array-item chrome after the ui5 Box
 * migration. The closed prompt pairs Box icon gutter with a `flexBasis="0%"
 * flexGrow={1}` Box holding ellipsis text — if the migrated Box loses its
 * min-width semantics the ellipsis silently turns into overflow, so one
 * state narrows the card until the prompt actually truncates. Values are
 * fixtures (popover stays closed; Menu/Popover animate).
 */
export function IncompatibleItemTypeStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              object value
            </Text>
            <IncompatibleItemType value={{_type: 'legacyBlock', title: 'Legacy block'}} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              string value
            </Text>
            <IncompatibleItemType value="legacy-string-item" />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              long type name (ellipsis)
            </Text>
            <div style={{maxWidth: 240}}>
              <IncompatibleItemType
                value={{_type: 'legacyMarketingHeroBannerWithCallToActionBlock', title: 'Legacy'}}
              />
            </div>
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
