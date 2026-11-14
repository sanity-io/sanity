import {
  type Dispatch,
  type ReactNode,
  type Ref,
  type SetStateAction,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../i18n'
import {useVisionExperience, type VisionLayout} from '../store/VisionActorContext'
import {CollapsiblePanel, type CollapsiblePanelTab, PANEL_HEADER_HEIGHT} from './CollapsiblePanel'
import {bottomPanelSizeToFit} from './fitPanelSize'
import * as styles from './redesign.module.css'
import {ResizableSplit, SPLIT_HANDLE_SIZE} from './ResizableSplit'

/** The main area may never be dragged smaller than this */
const MIN_MAIN_HEIGHT = 120

/** The bottom panel's tab, whether it is collapsed, and the height dragged per layout */
export interface BottomPanelState {
  activeTabId: string
  collapsed: boolean
  bottomSizes: Partial<Record<VisionLayout, number>>
}

export interface SplitWithBottomPanelHandle {
  /** Sizes the bottom panel to its open tab, or as tall as the split allows */
  fitToContent: () => void
}

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
  /**
   * Controlled tab, collapsed flag and height. Without it the panel keeps its own, which resets
   * when this component remounts.
   */
  state?: BottomPanelState
  onStateChange?: Dispatch<SetStateAction<BottomPanelState>>
  /** Double-clicking a tab sizes the panel to that tab. A single click only selects it. */
  fitOnTabDoubleClick?: boolean
  ref?: Ref<SplitWithBottomPanelHandle | null>
}

/**
 * A column of the query tab: the main area (editor or result) above a resizable, collapsible
 * tabbed panel. The height is remembered per layout, since one dragged for two columns rarely
 * suits a stacked pane. The footer, when there is one, stays below the split.
 */
export function SplitWithBottomPanel(props: SplitWithBottomPanelProps) {
  const {
    id,
    testId,
    children,
    tabs,
    defaultBottomSize,
    footer,
    state,
    onStateChange,
    fitOnTabDoubleClick = false,
    ref,
  } = props
  const {t} = useTranslation(visionLocaleNamespace)
  const {layout} = useVisionExperience()
  const [uncontrolled, setUncontrolled] = useState<BottomPanelState>(() => ({
    activeTabId: tabs[0]?.id ?? '',
    collapsed: false,
    bottomSizes: {},
  }))
  const panelState = state ?? uncontrolled
  const setPanelState = onStateChange ?? setUncontrolled
  const bottomSize = panelState.bottomSizes[layout] ?? defaultBottomSize[layout]
  const containerRef = useRef<HTMLDivElement>(null)
  const [fitRequest, setFitRequest] = useState(0)

  const selectTab = useCallback(
    (tabId: string) => {
      setPanelState((current) =>
        current.activeTabId === tabId ? current : {...current, activeTabId: tabId},
      )
    },
    [setPanelState],
  )
  const toggle = useCallback(() => {
    setPanelState((current) => ({...current, collapsed: !current.collapsed}))
  }, [setPanelState])
  const requestFit = useCallback(
    (tabId?: string) => {
      setPanelState((current) => {
        const activeTabId = tabId ?? current.activeTabId
        if (!current.collapsed && current.activeTabId === activeTabId) return current
        return {...current, activeTabId, collapsed: false}
      })
      setFitRequest((count) => count + 1)
    },
    [setPanelState],
  )

  useImperativeHandle(ref, () => ({fitToContent: requestFit}), [requestFit])

  // After the open tab has mounted (a click selects it before the double-click, and a collapsed
  // panel expands first). Measuring in an effect sees the editor the tab's own effects created.
  useEffect(() => {
    if (fitRequest === 0) return undefined
    const apply = () => {
      const container = containerRef.current
      const split = container?.querySelector<HTMLElement>(`[data-testid="${testId}-split"]`)
      const header = container?.querySelector<HTMLElement>(
        `[data-testid="${id}-panel"]`,
      )?.firstElementChild
      const content = container?.querySelector<HTMLElement>('[data-vision-panel-content]')
      if (!split || !(header instanceof HTMLElement) || !content) return
      const size = bottomPanelSizeToFit({
        headerHeight: header.offsetHeight,
        contentHeight: content.offsetHeight,
        containerHeight: split.clientHeight,
        minMainHeight: MIN_MAIN_HEIGHT,
        handleSize: SPLIT_HANDLE_SIZE,
      })
      if (size === null) return
      setPanelState((current) =>
        current.bottomSizes[layout] === size && !current.collapsed
          ? current
          : {
              ...current,
              collapsed: false,
              bottomSizes: {...current.bottomSizes, [layout]: size},
            },
      )
    }
    apply()
    const frame = requestAnimationFrame(apply)
    return () => cancelAnimationFrame(frame)
  }, [fitRequest, id, layout, setPanelState, testId])

  return (
    <Flex data-testid={testId} flexDirection="column" height="100%">
      <Box className={styles.splitPaneContainer} ref={containerRef}>
        <ResizableSplit
          allowResize={!panelState.collapsed}
          label={t('vision.split.bottom-panel')}
          minSecondarySize={MIN_MAIN_HEIGHT}
          minSize={PANEL_HEADER_HEIGHT}
          onChange={(size) =>
            setPanelState((current) => ({
              ...current,
              bottomSizes: {...current.bottomSizes, [layout]: size},
            }))
          }
          onReset={() =>
            setPanelState((current) => ({
              ...current,
              bottomSizes: {...current.bottomSizes, [layout]: undefined},
            }))
          }
          primary="second"
          size={panelState.collapsed ? PANEL_HEADER_HEIGHT : bottomSize}
          split="horizontal"
          testId={`${testId}-split`}
        >
          <Flex className={styles.paneFill}>{children}</Flex>
          <Box className={styles.paneFill}>
            <CollapsiblePanel
              activeTabId={panelState.activeTabId}
              collapsed={panelState.collapsed}
              id={id}
              onTabChange={selectTab}
              onTabDoubleClick={fitOnTabDoubleClick ? requestFit : undefined}
              onToggle={toggle}
              tabs={tabs}
            />
          </Box>
        </ResizableSplit>
      </Box>
      {footer}
    </Flex>
  )
}
