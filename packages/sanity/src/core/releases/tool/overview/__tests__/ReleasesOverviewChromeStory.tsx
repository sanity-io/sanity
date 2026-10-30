import {AddIcon} from '@sanity/icons/Add'
import {Card} from '@sanity/ui'
import {Box, Flex, Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {Button} from '../../../../../ui-components/button/Button'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {CalendarPopover} from '../CalendarPopover'
import {ReleasesEmptyState} from '../ReleasesEmptyState'

const noop = () => undefined

const CALENDAR_CONTENT = (
  <Box padding={3}>
    <Text size={1}>Calendar filter content</Text>
  </Box>
)

/**
 * Chromatic sentinel for the releases overview chrome: the closed calendar
 * filter trigger in its dialog variant and the empty state with its
 * illustration, copy and action row. The popover variant is left out: nested
 * in the closed `Popover`, its trigger `Tooltip` reads a `null` reference
 * element while the hidden content reappears and throws in floating-ui. The
 * upsell context is the fallback `default` mode, so the empty state renders;
 * nothing reaches the releases store.
 */
export function ReleasesOverviewChromeStory() {
  return (
    <TestWrapper i18nBundles={[releasesUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              calendar filter trigger
            </Text>
            <Flex gap={2}>
              <CalendarPopover asDialog content={CALENDAR_CONTENT} />
            </Flex>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              empty state
            </Text>
            <Card border radius={2} style={{height: 360}}>
              <Flex flexDirection="column" style={{height: '100%'}}>
                <ReleasesEmptyState
                  createReleaseButton={
                    <Button icon={AddIcon} onClick={noop} text="New release" tone="primary" />
                  }
                />
              </Flex>
            </Card>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
