import {SplitPane} from '@rexxars/react-split-pane'
import {type ReactNode, useState} from 'react'
import {Box, Flex} from 'ui5'

import {useVistaExperience, type VistaLayout} from '../store/VistaActorContext'
import {CollapsiblePanel, type CollapsiblePanelTab, PANEL_HEADER_HEIGHT} from './CollapsiblePanel'
import {paneFill, splitPaneContainer} from './vista.css'

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
  defaultBottomSize: Record<VistaLayout, number>
}

/**
 * A column of the query tab: the main area (editor or result) above a resizable, collapsible
 * tabbed panel. Owns the panel's active tab, collapsed flag and dragged height; the height is
 * remembered per layout, since one dragged for two columns rarely suits a stacked pane.
 */
export function SplitWithBottomPanel(props: SplitWithBottomPanelProps) {
  const {id, testId, children, tabs, defaultBottomSize} = props
  const {layout} = useVistaExperience()
  const [activeTabId, setActiveTabId] = useState(() => tabs[0].id)
  const [collapsed, setCollapsed] = useState(false)
  const [bottomSizes, setBottomSizes] = useState<Partial<Record<VistaLayout, number>>>({})
  const bottomSize = bottomSizes[layout] ?? defaultBottomSize[layout]

  return (
    <Flex data-testid={testId} flexDirection="column" height="100%">
      <Box className={splitPaneContainer}>
        <SplitPane
          allowResize={!collapsed}
          maxSize={-MIN_MAIN_HEIGHT}
          minSize={PANEL_HEADER_HEIGHT}
          onChange={(size: number) => setBottomSizes((sizes) => ({...sizes, [layout]: size}))}
          primary="second"
          size={collapsed ? PANEL_HEADER_HEIGHT : bottomSize}
          split="horizontal"
        >
          <Flex className={paneFill}>{children}</Flex>
          <Box className={paneFill}>
            <CollapsiblePanel
              activeTabId={activeTabId}
              collapsed={collapsed}
              id={id}
              onTabChange={setActiveTabId}
              onToggle={() => setCollapsed((current) => !current)}
              tabs={tabs}
            />
          </Box>
        </SplitPane>
      </Box>
    </Flex>
  )
}
