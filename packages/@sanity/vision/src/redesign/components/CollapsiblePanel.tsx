import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Button, TabList, TabPanel, type ButtonTone} from '@sanity/ui'
import {type FocusEvent, type MouseEvent, type ReactNode, useEffect, useRef} from 'react'
import {useTranslation} from 'sanity/i18n'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../i18n'
import {useScrolledFromTop} from '../hooks/useScrolledFromTop'
import {cx} from '../util/cx'
import * as motion from './CollapsiblePanel.module.css'
import * as styles from './redesign.module.css'
import {useTabElementId} from './tabs/queryTabShown'

/**
 * Height of the tab header, which is all that remains of a collapsed panel. The tool's root sets
 * it as `--vision-bottom-bar-height`, the height of every bar along the bottom of the tool.
 */
export const PANEL_HEADER_HEIGHT = 35
/** A bar along the bottom of the tool (`.bottomBar`), the 1px rule along its top included */
export const BOTTOM_BAR_HEIGHT = PANEL_HEADER_HEIGHT + 1
/** The rule between the tab header and the panel's body (`.panelBody`) */
export const PANEL_BODY_BORDER = 1

export interface CollapsiblePanelTab {
  id: string
  label: ReactNode
  /** Rendered after the label, for instance a count or a warning icon */
  icon?: ReactNode
  /**
   * Draws the tab like a Content Releases filter chip. The Lint tab uses the tone of the worst
   * finding once the query has any, so the count in its label reads as a soft pill in the tab row.
   */
  tone?: ButtonTone
  /** Softens `tone`, the way the releases Errors chip does */
  muted?: boolean
  /**
   * Stretches the content to the panel, for content that scrolls or pans inside its own box (an
   * editor, a graph, a virtual list) rather than growing with what it shows
   */
  fill?: boolean
  /**
   * A row of controls above the content (the params' view tabs, the source map's view menu). It
   * stays in place while the content scrolls below it.
   */
  toolbar?: ReactNode
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
  /**
   * Double-clicking a tab sizes the panel to that tab. A single click only selects it (and
   * expands a collapsed panel).
   */
  onTabDoubleClick?: (id: string) => void
}

/**
 * The tabbed bottom panel of the request and response columns. When collapsed only the tab
 * header remains, with no tab selected, and picking a tab expands it again on that tab.
 */
export function CollapsiblePanel(props: CollapsiblePanelProps) {
  const {
    id: idPrefix,
    tabs,
    activeTabId,
    collapsed,
    onTabChange,
    onToggle,
    onTabDoubleClick,
  } = props
  const tabElementId = useTabElementId()
  const elementId = (suffix: string) => tabElementId(`${idPrefix}-${suffix}`)
  const activeTab = tabs.find((tab) => tab.id === activeTabId) || tabs[0]
  const stripRef = useRef<HTMLDivElement>(null)
  const {scrolled: bodyScrolled, setScroller: setBodyScroller} = useScrolledFromTop()
  // Changes when the tabs do, rather than with every new array of them
  const tabIds = tabs.map((tab) => tab.id).join(' ')

  // The tab strip scrolls sideways when the tabs do not fit, and keeps the selected tab in it
  // whole: the last tabs are otherwise cut at the edge when picked, or pushed out of it when a
  // tab before them grows a count
  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return undefined
    const tabElement = (tabId: string) =>
      strip.querySelector<HTMLElement>(`[id="${tabElementId(`${idPrefix}-${tabId}-tab`)}"]`)
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
  }, [activeTab.id, idPrefix, tabElementId, tabIds])

  return (
    <Flex data-testid={`${idPrefix}-panel`} flexDirection="column" height="100%" minHeight="0">
      <Flex alignItems="center" className={styles.panelBar} gap={2} justifyContent="space-between">
        <Box className={styles.panelTabs} ref={stripRef}>
          <TabList gap={1}>
            {tabs.map((tab) => (
              <PanelTab
                aria-controls={collapsed ? undefined : elementId(`${tab.id}-panel`)}
                // The tab that was open stays the tablist's tab stop while no tab is selected
                focusable={tab.id === activeTab.id}
                icon={tab.icon}
                id={elementId(`${tab.id}-tab`)}
                key={tab.id}
                label={tab.label}
                muted={tab.muted}
                onClick={() => {
                  onTabChange(tab.id)
                  if (collapsed) onToggle()
                }}
                onDoubleClick={
                  onTabDoubleClick
                    ? (event) => {
                        event.preventDefault()
                        onTabDoubleClick(tab.id)
                      }
                    : undefined
                }
                selected={!collapsed && tab.id === activeTab.id}
                tone={tab.tone}
              />
            ))}
          </TabList>
        </Box>
        <PanelToggle
          collapsed={collapsed}
          controls={elementId(`${activeTab.id}-panel`)}
          onToggle={onToggle}
          testId={`${idPrefix}-panel-toggle`}
        />
      </Flex>
      {!collapsed && (
        <TabPanel
          aria-labelledby={elementId(`${activeTab.id}-tab`)}
          className={cx(motion.body, styles.panelBody)}
          display="flex"
          flex={1}
          id={elementId(`${activeTab.id}-panel`)}
        >
          {activeTab.toolbar && (
            <div
              className={styles.paneToolbar}
              data-scrolled={bodyScrolled}
              data-vision-panel-toolbar=""
            >
              {activeTab.toolbar}
            </div>
          )}
          <div
            className={styles.paneScroll}
            data-fill={activeTab.fill ? '' : undefined}
            // Each tab's content (and each of its views that fill the panel or not) starts at its top
            key={`${activeTab.id}:${Boolean(activeTab.fill)}`}
            ref={setBodyScroller}
          >
            {/*
              Not stretched to the panel: its height is the tab's content, which fit-to-content
              measures. A stretched child would report the panel it sits in.
            */}
            <div
              className={cx(styles.panelContent, activeTab.fill && styles.panelContentFill)}
              data-vision-panel-content=""
            >
              {activeTab.content}
            </div>
          </div>
        </TabPanel>
      )}
    </Flex>
  )
}

interface PanelToggleProps {
  collapsed: boolean
  /** The id of the body it shows and hides */
  controls: string
  onToggle: () => void
  testId: string
}

/** The chevron at the end of a collapsible panel's header, which collapses or expands it */
export function PanelToggle(props: PanelToggleProps) {
  const {collapsed, controls, onToggle, testId} = props
  const {t} = useTranslation(visionLocaleNamespace)
  return (
    <Button
      aria-controls={collapsed ? undefined : controls}
      aria-expanded={!collapsed}
      aria-label={collapsed ? t('vision.panel.expand') : t('vision.panel.collapse')}
      className={motion.toggle}
      data-testid={testId}
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
  )
}

interface PanelTabProps {
  'aria-controls': string | undefined
  'id': string
  'label': ReactNode
  'icon'?: ReactNode
  'tone'?: ButtonTone
  'muted'?: boolean
  'selected': boolean
  /** Whether the tab is the tablist's tab stop, which \@sanity/ui's `Tab` ties to `selected` */
  'focusable': boolean
  /** Set by `TabList` while the arrow keys move through the tabs */
  'focused'?: boolean
  'onFocus'?: (event: FocusEvent<HTMLButtonElement>) => void
  'onClick': () => void
  'onDoubleClick'?: (event: MouseEvent<HTMLButtonElement>) => void
}

/**
 * A tab of the panel's header. \@sanity/ui's `Tab`, except that it can be the tab stop without
 * being selected: a collapsed panel shows no tab as selected, and keyboard users still reach the
 * tab that was open.
 */
function PanelTab(props: PanelTabProps) {
  const {focusable, focused, label, onFocus, selected, tone, ...rest} = props
  const ref = useRef<HTMLButtonElement>(null)
  const focusedRef = useRef(false)

  useEffect(() => {
    if (focused && !focusedRef.current) {
      ref.current?.focus()
      focusedRef.current = true
    }
  }, [focused])

  return (
    <Button
      {...rest}
      aria-selected={selected}
      className={styles.panelTab}
      data-tone={tone}
      fontSize={1}
      mode="bleed"
      onBlur={() => {
        focusedRef.current = false
      }}
      onFocus={(event) => {
        focusedRef.current = true
        onFocus?.(event)
      }}
      padding={2}
      ref={ref}
      role="tab"
      selected={selected}
      tabIndex={focusable ? 0 : -1}
      text={label}
      tone={tone}
      type="button"
    />
  )
}
