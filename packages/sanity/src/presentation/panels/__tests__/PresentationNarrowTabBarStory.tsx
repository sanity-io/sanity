import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {presentationUsEnglishLocaleBundle} from '../../i18n'
import {PresentationNarrowTabBar} from '../PresentationNarrowTabBar'

const NOOP = () => undefined

/**
 * Chromatic sentinel for Presentation's narrow-viewport tab bar after the
 * ui5 Flex migration. Centered TabList, selected tab, and the optional
 * Navigator tab pin layout that TypeScript will not catch. Labels come from
 * the presentation locale bundle (no live preview iframe).
 */
export function PresentationNarrowTabBarStory() {
  return (
    <TestWrapper i18nBundles={[presentationUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              preview selected
            </Text>
            <PresentationNarrowTabBar
              activeTab="preview"
              navigatorEnabled={false}
              onTabChange={NOOP}
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              navigator enabled
            </Text>
            <PresentationNarrowTabBar activeTab="content" navigatorEnabled onTabChange={NOOP} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              navigator selected
            </Text>
            <PresentationNarrowTabBar activeTab="navigator" navigatorEnabled onTabChange={NOOP} />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
