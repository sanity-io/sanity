import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Button, Tab, TabList, TabPanel} from '@sanity/ui'
import {type ReactNode, useEffect, useRef} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../i18n'
import {cx} from '../util/cx'
import * as motion from './CollapsiblePanel.module.css'
import * as styles from './vista.module.css'

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
  const stripRef = useRef<HTMLDivElement>(null)
  // Changes when the tabs do, rather than with every new array of them
  const tabIds = tabs.map((tab) => tab.id).join(' ')

  // The tab strip scrolls sideways when the tabs do not fit, and keeps the selected tab in it
  // whole: the last tabs are otherwise cut at the edge when picked, or pushed out of it when a
  // tab before them grows a count
  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return undefined
    const tabElement = (tabId: string) => document.getElementById(`${idPrefix}-${tabId}-tab`)
    const reveal = () => {
      const tab = tabElement(activeTab.id)
      if (!tab) return
      const stripBox = strip.getBoundingClientRect()
      const tabBox = tab.getBoundingClientRect()
      if (tabBox.left < stripBox.left) strip.scrollLeft -= stripBox.left - tabBox.left
      else if (tabBox.right > stripBox.right) strip.scrollLeft += tabBox.right - stripBox.right
    }
    reveal()
    const observer = new ResizeObserver(reveal)
    for (const tabId of tabIds.split(' ')) {
      const tab = tabElement(tabId)
      if (tab) observer.observe(tab)
    }
    return () => observer.disconnect()
  }, [activeTab.id, idPrefix, tabIds])

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
        <Box className={styles.panelTabs} ref={stripRef}>
          <TabList gap={1}>
            {tabs.map((tab) => (
              <Tab
                aria-controls={`${idPrefix}-${tab.id}-panel`}
                className={motion.pressable}
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
                // A tablist always has a selected tab; collapsing hides its panel, no more
                selected={tab.id === activeTab.id}
              />
            ))}
          </TabList>
        </Box>
        <Button
          aria-controls={collapsed ? undefined : `${idPrefix}-${activeTab.id}-panel`}
          aria-expanded={!collapsed}
          aria-label={collapsed ? t('vista.panel.expand') : t('vista.panel.collapse')}
          className={cx(motion.pressable, motion.toggle)}
          data-testid={`${idPrefix}-panel-toggle`}
          fontSize={1}
          icon={
            <span className={motion.toggleChevron}>
              <ChevronDownIcon />
            </span>
          }
          mode="bleed"
          onClick={onToggle}
          padding={2}
        />
      </Flex>
      {!collapsed && (
        <TabPanel
          aria-labelledby={`${idPrefix}-${activeTab.id}-tab`}
          className={motion.body}
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
