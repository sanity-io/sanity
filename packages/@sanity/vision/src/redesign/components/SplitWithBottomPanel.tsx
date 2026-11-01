import {type ReactNode, useState} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../i18n'
import {useVisionExperience, type VisionLayout} from '../store/VisionActorContext'
import {CollapsiblePanel, type CollapsiblePanelTab, PANEL_HEADER_HEIGHT} from './CollapsiblePanel'
import * as styles from './redesign.module.css'
import {ResizableSplit} from './ResizableSplit'

/** The main area may never be dragged smaller than this */
const MIN_MAIN_HEIGHT = 120

export interface SplitWithBottomPanelProps {
  /** Prefix for the bottom panel's element ids and test ids */
  id: string
  testId: string
  /** The main area above the bottom panel */
  children: ReactNode
  /** The bottom panel's tabs; the first one starts out selected */
  tabs: CollapsiblePanelTab[]
  /** Initial height of the bottom panel, per layout */
  defaultBottomSize: Record<VisionLayout, number>
  /** Rendered below the split pane, such as the bottom action bar */
  footer?: ReactNode
}

/**
 * A column of the query tab: the main area (editor or result) above a resizable, collapsible
 * tabbed panel. Owns the panel's active tab, collapsed flag and dragged height; the height is
 * remembered per layout, since one dragged for two columns rarely suits a stacked pane.
 */
export function SplitWithBottomPanel(props: SplitWithBottomPanelProps) {
  const {id, testId, children, tabs, defaultBottomSize, footer} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const {layout} = useVisionExperience()
  const [activeTabId, setActiveTabId] = useState(() => tabs[0].id)
  const [collapsed, setCollapsed] = useState(false)
  const [bottomSizes, setBottomSizes] = useState<Partial<Record<VisionLayout, number>>>({})
  const bottomSize = bottomSizes[layout] ?? defaultBottomSize[layout]

  return (
    <Flex data-testid={testId} flexDirection="column" height="100%">
      <Box className={styles.splitPaneContainer}>
        <ResizableSplit
          allowResize={!collapsed}
          label={t('vision.split.bottom-panel')}
          minSecondarySize={MIN_MAIN_HEIGHT}
          minSize={PANEL_HEADER_HEIGHT}
          onChange={(size) => setBottomSizes((sizes) => ({...sizes, [layout]: size}))}
          onReset={() => setBottomSizes((sizes) => ({...sizes, [layout]: undefined}))}
          primary="second"
          size={collapsed ? PANEL_HEADER_HEIGHT : bottomSize}
          split="horizontal"
          testId={`${testId}-split`}
        >
          <Flex className={styles.paneFill}>{children}</Flex>
          <Box className={styles.paneFill}>
            <CollapsiblePanel
              activeTabId={activeTabId}
              collapsed={collapsed}
              id={id}
              onTabChange={setActiveTabId}
              onToggle={() => setCollapsed((current) => !current)}
              tabs={tabs}
            />
          </Box>
        </ResizableSplit>
      </Box>
      {footer}
    </Flex>
  )
}
