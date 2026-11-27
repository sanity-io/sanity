import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Label} from '@sanity/ui'
import {type ReactNode, useCallback, useRef, ViewTransition} from 'react'
import {useTranslation} from 'sanity/i18n'
import {Box, Flex, Text} from 'ui5'

import {useVisionTelemetry} from '../../../__telemetry__/useVisionTelemetry'
import {visionLocaleNamespace} from '../../../i18n'
import {useScrolledFromTop} from '../../hooks/useScrolledFromTop'
import {useVisionExperience, type VisionLayout} from '../../store/VisionActorContext'
import {cx} from '../../util/cx'
import {PANEL_HEADER_HEIGHT, PanelToggle} from '../CollapsiblePanel'
import * as motion from '../CollapsiblePanel.module.css'
import {usePanelSnapShut} from '../panelSnapShut'
import {PANEL_PANE, PANEL_TRANSITION, startLayoutTransition} from '../panelTransitions'
import {useParamsSection} from '../queryTabLayout'
import * as styles from '../redesign.module.css'
import {ResizableSplit, SPLIT_HANDLE_SIZE} from '../ResizableSplit'
import {useTabElementId} from '../tabs/queryTabShown'
import {VisionTooltip} from '../VisionTooltip'

/** The query editor keeps this much of the main area while the params are dragged taller */
const MIN_QUERY_HEIGHT = 120

/** The query editor at its smallest, above the header of the collapsed params */
export const MIN_QUERY_PARAMS_HEIGHT = MIN_QUERY_HEIGHT + SPLIT_HANDLE_SIZE + PANEL_HEADER_HEIGHT

/** How tall the expanded params start out, header included, per layout */
const DEFAULT_PARAMS_HEIGHT: Record<VisionLayout, number> = {
  columns: 180,
  stacked: 160,
  mobile: 140,
}

export interface QueryParamsSplitProps {
  /** The query editor, above the params */
  query: ReactNode
  /** The params' toolbar actions, after their label: copy, format, the view menu, the actions */
  actions: ReactNode
  /** The params do not parse, which the header says while the section is collapsed too */
  invalid: boolean
  /** The params editor or form */
  children: ReactNode
}

/**
 * The query editor above the params, as old Vision had them: Params is a section of its own,
 * with a header like the query's and the result's, resized by the divider between them and
 * collapsed to that header the way the bottom panels collapse to their tabs: by its toggle, or by
 * dragging it below one line of params.
 */
export function QueryParamsSplit(props: QueryParamsSplitProps) {
  const {query, actions, invalid, children} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const telemetry = useVisionTelemetry()
  const {layout} = useVisionExperience()
  const {state, setSizes, setCollapsed} = useParamsSection()
  const {collapsed} = state
  const tabElementId = useTabElementId()
  const bodyId = tabElementId('vision-params-body')
  const {scrolled, setScroller} = useScrolledFromTop()
  const containerRef = useRef<HTMLDivElement>(null)
  const defaultSize = DEFAULT_PARAMS_HEIGHT[layout]
  const size = state.sizes[layout] ?? defaultSize

  const toggle = useCallback(() => {
    telemetry.panelToggled('params', collapsed)
    startLayoutTransition(PANEL_TRANSITION, () => setCollapsed(!collapsed))
  }, [collapsed, setCollapsed, telemetry])
  const collapseShrunk = useCallback(
    (restoreSize: number | undefined) => {
      telemetry.panelToggled('params', false)
      setCollapsed(true)
      setSizes((current) => ({...current, [layout]: restoreSize}))
    },
    [layout, setCollapsed, setSizes, telemetry],
  )
  const snapShut = usePanelSnapShut({
    containerRef,
    handleTestId: 'vision-query-params-split-handle',
    toggleTestId: 'vision-params-toggle',
    defaultSize,
    collapse: collapseShrunk,
  })

  return (
    <Box className={styles.splitPaneContainer} ref={containerRef}>
      <ResizableSplit
        allowResize={!collapsed}
        label={t('vision.split.query-params')}
        minSecondarySize={MIN_QUERY_HEIGHT}
        minSize={PANEL_HEADER_HEIGHT}
        onChange={(next) => setSizes((current) => ({...current, [layout]: next}))}
        onResizeEnd={snapShut}
        onReset={() => setSizes((current) => ({...current, [layout]: undefined}))}
        primary="second"
        size={collapsed ? PANEL_HEADER_HEIGHT : size}
        split="horizontal"
        testId="vision-query-params-split"
      >
        <ViewTransition default={PANEL_PANE}>
          <Flex className={styles.paneFill}>{query}</Flex>
        </ViewTransition>
        <ViewTransition default={PANEL_PANE}>
          <Flex
            className={styles.paneFill}
            data-testid="vision-params"
            data-vision-params-content=""
            flexDirection="column"
          >
            <div
              className={cx(styles.paneToolbar, styles.paneToolbarMain)}
              data-scrolled={!collapsed && scrolled}
              data-testid="vision-params-toolbar"
            >
              <Flex alignItems="center" className={styles.paneToolbarLabel} gap={2}>
                <Label muted size={1}>
                  {t('params.label')}
                </Label>
                {invalid && (
                  <VisionTooltip content={t('params.error.params-invalid-json')} placement="bottom">
                    <Text data-testid="vision-params-invalid" size={1} tone="critical">
                      <WarningOutlineIcon aria-label={t('params.error.params-invalid-json')} />
                    </Text>
                  </VisionTooltip>
                )}
              </Flex>
              <Flex alignItems="center" data-testid="vision-params-toolbar-actions" gap={1}>
                {actions}
                <PanelToggle
                  collapsed={collapsed}
                  controls={bodyId}
                  onToggle={toggle}
                  testId="vision-params-toggle"
                />
              </Flex>
            </div>
            {!collapsed && (
              <div className={cx(motion.body, styles.paneScroll)} id={bodyId} ref={setScroller}>
                {children}
              </div>
            )}
          </Flex>
        </ViewTransition>
      </ResizableSplit>
    </Box>
  )
}
