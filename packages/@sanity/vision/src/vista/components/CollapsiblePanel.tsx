import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronUpIcon} from '@sanity/icons/ChevronUp'
import {Button, Tab, TabList, TabPanel} from '@sanity/ui'
import {type ReactNode} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../i18n'
import {panelTabs} from './vista.css'

/** Height of the tab header, which is all that remains of a collapsed panel */
export const PANEL_HEADER_HEIGHT = 35

export interface CollapsiblePanelTab {
  id: string
  label: ReactNode
  /** Rendered after the label, for instance a count or a warning icon */
  icon?: ReactNode
  content: ReactNode
}

export interface CollapsiblePanelProps {
  /** Prefix for the tab and panel element ids */
  id: string
  tabs: CollapsiblePanelTab[]
  activeTabId: string
  collapsed: boolean
  onTabChange: (id: string) => void
  onToggle: () => void
}

/**
 * The tabbed bottom panel of the request and response columns. When collapsed only the tab
 * header remains, and picking a tab expands it again.
 */
export function CollapsiblePanel(props: CollapsiblePanelProps) {
  const {id: idPrefix, tabs, activeTabId, collapsed, onTabChange, onToggle} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const activeTab = tabs.find((tab) => tab.id === activeTabId) || tabs[0]

  return (
    <Flex data-testid={`${idPrefix}-panel`} flexDirection="column" height="100%" minHeight="0">
      <Flex
        alignItems="center"
        borderBottom={!collapsed}
        flexShrink={0}
        gap={2}
        height={`${PANEL_HEADER_HEIGHT}px`}
        justifyContent="space-between"
        paddingX={2}
      >
        <Box className={panelTabs}>
          <TabList gap={1}>
            {tabs.map((tab) => (
              <Tab
                aria-controls={`${idPrefix}-${tab.id}-panel`}
                fontSize={1}
                icon={tab.icon}
                id={`${idPrefix}-${tab.id}-tab`}
                key={tab.id}
                label={tab.label}
                onClick={() => {
                  onTabChange(tab.id)
                  if (collapsed) onToggle()
                }}
                padding={2}
                selected={!collapsed && tab.id === activeTab.id}
              />
            ))}
          </TabList>
        </Box>
        <Button
          aria-label={collapsed ? t('vista.panel.expand') : t('vista.panel.collapse')}
          data-testid={`${idPrefix}-panel-toggle`}
          fontSize={1}
          icon={collapsed ? ChevronUpIcon : ChevronDownIcon}
          mode="bleed"
          onClick={onToggle}
          padding={2}
        />
      </Flex>
      {!collapsed && (
        <TabPanel
          aria-labelledby={`${idPrefix}-${activeTab.id}-tab`}
          flex={1}
          id={`${idPrefix}-${activeTab.id}-panel`}
          overflow="auto"
        >
          {activeTab.content}
        </TabPanel>
      )}
    </Flex>
  )
}
