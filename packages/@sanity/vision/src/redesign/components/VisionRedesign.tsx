import {TooltipDelayGroupProvider} from '@sanity/ui/tooltip'
import {useActorRef, useSelector} from '@xstate/react'
import {
  Activity,
  type CSSProperties,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  ViewTransition,
} from 'react'
import {Flex} from 'ui5'

import {useVisionTelemetry} from '../../__telemetry__/useVisionTelemetry'
import {useSavedQueries} from '../../hooks/useSavedQueries'
import {type VisionConfig} from '../../types'
import {useContentSize} from '../hooks/useContentSize'
import {type VisionTab} from '../store/types'
import {
  createPendingEdits,
  PendingEditsContext,
  SavedQueriesContext,
  type TabDrawerSlot,
  TabDrawerSlotContext,
  usePersistVisionState,
  VisionActorContext,
  type VisionExperience,
  VisionExperienceContext,
} from '../store/VisionActorContext'
import {selectActiveTab, selectOpenDrawer, toTabDrawer, visionMachine} from '../store/visionMachine'
import {loadVisionState, type VisionStorageDefaults} from '../store/visionStorage'
import {cx} from '../util/cx'
import {estimateVisionLayoutWidths, getVisionLayout} from '../util/visionLayout'
import {AiCreditsUpsellProvider} from './AiCreditsUpsell'
import {AiFeaturesProvider} from './AiFeaturesProvider'
import {PANEL_HEADER_HEIGHT} from './CollapsiblePanel'
import {OpenSavedQueriesAsTabs} from './OpenSavedQueriesAsTabs'
import {TABS_AREA} from './panelTransitions'
import {QueryTabLayoutProvider} from './queryTabLayout'
import * as styles from './redesign.module.css'
import {useShownInSidebar} from './sidebar/useShownInSidebar'
import {VisionSidebar} from './sidebar/VisionSidebar'
import {QueryTab, type QueryTabProps} from './tabs/QueryTab'
import {QueryTabBar} from './tabs/QueryTabBar'
import {HiddenQueryTabContext} from './tabs/queryTabShown'
import * as themeStyles from './themeTokens.module.css'
import {VisionDialogs} from './VisionDialogs'
import {VisionUrlState} from './VisionUrlState'
import {VisionWebMcp} from './VisionWebMcp'

/**
 * The first tooltip waits a moment so passing the pointer over a control does not flash one; once
 * one is open, its neighbours open without waiting, as in the studio's own toolbars
 */
const TOOLTIP_DELAY = {open: 400}

interface VisionRootStyle extends CSSProperties {
  '--vision-bottom-bar-height': string
}

const ROOT_STYLE: VisionRootStyle = {'--vision-bottom-bar-height': `${PANEL_HEADER_HEIGHT}px`}

/**
 * The element the active tab renders a tool into (see `TabDrawerSlot`). It takes no part in the
 * layout, so the tool lays out in the drawer as if the drawer held it directly
 */
function createTabDrawerElement(): HTMLElement {
  const element = document.createElement('div')
  element.style.display = 'contents'
  return element
}

/**
 * A tab in the list of open ones, mounted for as long as it is open and hidden while another is
 * shown. Memoized, as a hidden tab has nothing to render again when the shown one changes
 */
function QueryTabActivity(props: QueryTabProps & {shown: boolean}) {
  const {shown, tab, ...rest} = props
  return (
    <Activity mode={shown ? 'visible' : 'hidden'}>
      <HiddenQueryTabContext value={shown ? null : tab.id}>
        <QueryTab tab={tab} {...rest} />
      </HiddenQueryTabContext>
    </Activity>
  )
}
const QueryTabActivityMemo = memo(QueryTabActivity)

/**
 * The open tabs in the order they were opened, whatever order the tab bar shows them in. React
 * moves the DOM nodes of keyed siblings whose order changes, and a moved tab loses its scroll
 * positions and restarts its transitions, so dragging a tab in the bar must not reorder the panes
 */
function useOpenOrder(tabs: VisionTab[]): VisionTab[] {
  const [ids, setIds] = useState(() => tabs.map((tab) => tab.id))
  const byId = new Map(tabs.map((tab) => [tab.id, tab]))
  const kept = ids.filter((id) => byId.has(id))
  const known = new Set(kept)
  const next = kept.concat(tabs.filter((tab) => !known.has(tab.id)).map((tab) => tab.id))
  if (next.length !== ids.length || next.some((id, index) => id !== ids[index])) setIds(next)
  return next.flatMap((id) => byId.get(id) ?? [])
}

export interface VisionRedesignProps {
  config: VisionConfig
  datasets: string[]
  projectId: string
  defaultDataset: string
}

export function VisionRedesign(props: VisionRedesignProps) {
  const {config, datasets, projectId, defaultDataset} = props
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const rootSize = useContentSize(rootElement)
  const [tabsElement, setTabsElement] = useState<HTMLDivElement | null>(null)
  const tabsSize = useContentSize(tabsElement)
  const [estimate] = useState(estimateVisionLayoutWidths)
  const layout = getVisionLayout({
    tool: rootSize?.width || estimate.tool,
    tabs: tabsSize?.width || estimate.tabs,
  })

  const defaults = useMemo(
    (): VisionStorageDefaults => ({
      datasets,
      defaultDataset,
      defaultApiVersion: `${config.defaultApiVersion}`,
    }),
    [datasets, defaultDataset, config.defaultApiVersion],
  )

  // `useActorRef` reads the input once, on mount, so the persisted state is loaded right then
  const [persisted] = useState(() => loadVisionState(projectId, defaults))
  const actorRef = useActorRef(visionMachine, {input: {projectId, persisted, defaults}})
  usePersistVisionState(actorRef, projectId)

  const activeTab = useSelector(actorRef, selectActiveTab)
  const tabs = useSelector(actorRef, (snapshot) => snapshot.context.tabs)
  const paneTabs = useOpenOrder(tabs)
  // The tab shown when the tool opens lifts its panels in; tabs shown later appear in place
  const [firstTabId] = useState(activeTab.id)
  const tabCount = tabs.length
  const telemetry = useVisionTelemetry()
  const tabCountRef = useRef<number | null>(null)
  useEffect(() => {
    const previous = tabCountRef.current
    tabCountRef.current = tabCount
    if (previous === null) telemetry.tabsChanged(tabCount, 'open')
    else if (tabCount > previous) telemetry.tabsChanged(tabCount, 'add')
    else if (tabCount < previous) telemetry.tabsChanged(tabCount, 'close')
  }, [tabCount, telemetry])
  const openDrawer = useSelector(actorRef, selectOpenDrawer)
  const experience = useMemo((): VisionExperience => ({layout}), [layout])
  const savedQueries = useSavedQueries()
  const [pendingEdits] = useState(createPendingEdits)
  const shownDrawer = useShownInSidebar(openDrawer, layout === 'mobile')
  const shownTabDrawer = toTabDrawer(shownDrawer)
  const [tabDrawerElement] = useState(createTabDrawerElement)
  const tabDrawerSlot = useMemo(
    (): TabDrawerSlot => ({element: tabDrawerElement, drawer: shownTabDrawer}),
    [shownTabDrawer, tabDrawerElement],
  )

  return (
    <VisionActorContext.Provider value={actorRef}>
      <VisionExperienceContext.Provider value={experience}>
        <SavedQueriesContext.Provider value={savedQueries}>
          <PendingEditsContext.Provider value={pendingEdits}>
            <TabDrawerSlotContext.Provider value={tabDrawerSlot}>
              <AiFeaturesProvider ai={config.ai}>
                <AiCreditsUpsellProvider projectId={projectId}>
                  <TooltipDelayGroupProvider delay={TOOLTIP_DELAY}>
                    <Flex
                      className={cx(styles.root, themeStyles.themeTokens)}
                      data-testid="vision-root"
                      data-vision-layout={layout}
                      height="100%"
                      overflow="hidden"
                      ref={setRootElement}
                      style={ROOT_STYLE}
                    >
                      <VisionSidebar shownDrawer={shownDrawer} />
                      <ViewTransition default={TABS_AREA}>
                        <Flex
                          data-testid="vision-tabs-area"
                          flexBasis="0%"
                          flexDirection="column"
                          flexGrow={1}
                          // Under a phone's full-width drawer the tabs area is covered and must not take focus
                          inert={layout === 'mobile' && openDrawer !== null}
                          minWidth="0"
                          overflow="hidden"
                          ref={setTabsElement}
                        >
                          <QueryTabBar />
                          <QueryTabLayoutProvider>
                            {/*
                              Every tab stays mounted, so switching tabs hides one and shows another
                              rather than remounting it: a tab shown again keeps its elements and
                              its state, and its editors their selection, undo history and scroll
                            */}
                            {paneTabs.map((tab) => (
                              <QueryTabActivityMemo
                                animateFirstShow={tab.id === firstTabId}
                                key={tab.id}
                                rootElement={rootElement}
                                shown={tab.id === activeTab.id}
                                tab={tab}
                              />
                            ))}
                          </QueryTabLayoutProvider>
                        </Flex>
                      </ViewTransition>
                    </Flex>
                    <VisionDialogs />
                    <VisionUrlState tab={activeTab} />
                    <OpenSavedQueriesAsTabs />
                    <VisionWebMcp tab={activeTab} />
                  </TooltipDelayGroupProvider>
                </AiCreditsUpsellProvider>
              </AiFeaturesProvider>
            </TabDrawerSlotContext.Provider>
          </PendingEditsContext.Provider>
        </SavedQueriesContext.Provider>
      </VisionExperienceContext.Provider>
    </VisionActorContext.Provider>
  )
}
