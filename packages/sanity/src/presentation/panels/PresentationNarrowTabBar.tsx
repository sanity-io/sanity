import {Card, Flex, TabList} from '@sanity/ui'
import {type FunctionComponent, useMemo} from 'react'
import {useTranslation} from 'sanity'

import {Tab} from '../../ui-components'
import {presentationLocaleNamespace} from '../i18n'
import {getPresentationPanelHtmlId, type PresentationLayoutTab} from './presentationLayoutTab'

interface PresentationNarrowTabBarProps {
  activeTab: PresentationLayoutTab
  navigatorEnabled: boolean
  onTabChange: (tab: PresentationLayoutTab) => void
}

/**
 * A tab bar shown above the panels at narrow viewports, allowing the user to
 * switch between showing the preview, the optional navigator, and the document
 * editor one at a time rather than cramming them side-by-side.
 *
 * @internal
 */
export const PresentationNarrowTabBar: FunctionComponent<PresentationNarrowTabBarProps> =
  function PresentationNarrowTabBar(props) {
    const {activeTab, navigatorEnabled, onTabChange} = props
    const {t} = useTranslation(presentationLocaleNamespace)

    const tabs = useMemo<{id: PresentationLayoutTab; label: string}[]>(
      () => [
        {id: 'preview', label: t('narrow-tabs.preview-tab.label')},
        ...(navigatorEnabled
          ? [{id: 'navigator' as const, label: t('narrow-tabs.navigator-tab.label')}]
          : []),
        {id: 'content', label: t('narrow-tabs.content-tab.label')},
      ],
      [navigatorEnabled, t],
    )

    return (
      <Card borderBottom paddingX={2} paddingY={1}>
        {/* Center the tab group within the bar rather than letting it sit against the left edge. */}
        <Flex justify="center">
          <TabList space={1}>
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                aria-controls={getPresentationPanelHtmlId(tab.id)}
                id={`presentation-narrow-tab-${tab.id}`}
                label={tab.label}
                onClick={() => onTabChange(tab.id)}
                selected={activeTab === tab.id}
              />
            ))}
          </TabList>
        </Flex>
      </Card>
    )
  }
