import {TooltipDelayGroupProvider} from '@sanity/ui/tooltip'
import {useActorRef, useSelector} from '@xstate/react'
import {Activity, memo, useEffect, useMemo, useRef, useState} from 'react'
import {Flex} from 'ui5'

import {useSavedQueries} from '../../hooks/useSavedQueries'
import {useVisionTelemetry} from '../../telemetry/useVisionTelemetry'
import {type VisionConfig} from '../../types'
import {useContentSize} from '../hooks/useContentSize'
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
  type VisionLayout,
} from '../store/VisionActorContext'
import {selectActiveTab, selectOpenDrawer, visionMachine} from '../store/visionMachine'
import {loadVisionState, type VisionStorageDefaults} from '../store/visionStorage'
import {AiCreditsUpsellProvider} from './AiCreditsUpsell'
import {AiFeaturesProvider} from './AiFeaturesProvider'
import {QueryTabLayoutProvider} from './queryTabLayout'
import * as styles from './redesign.module.css'
import {VisionSidebar} from './sidebar/VisionSidebar'
import {QueryTab, type QueryTabProps} from './tabs/QueryTab'
import {QueryTabBar} from './tabs/QueryTabBar'
import {HiddenQueryTabContext} from './tabs/queryTabShown'
import {VisionDialogs} from './VisionDialogs'
import {VisionUrlState} from './VisionUrlState'
import {VisionWebMcp} from './VisionWebMcp'

/** Below this width the request and response columns stack */
const STACKED_BREAKPOINT = 900
/** Below this width one column shows at a time and the sidebar floats over the content */
const MOBILE_BREAKPOINT = 600

function getVisionLayout(width: number): VisionLayout {
  if (width < MOBILE_BREAKPOINT) return 'mobile'
  if (width < STACKED_BREAKPOINT) return 'stacked'
  return 'columns'
}

/**
 * The first tooltip waits a moment so passing the pointer over a control does not flash one; once
 * one is open, its neighbours open without waiting, as in the studio's own toolbars
 */
const TOOLTIP_DELAY = {open: 400}

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

export interface VisionRedesignProps {
  config: VisionConfig
  datasets: string[]
  projectId: string
  defaultDataset: string
  onSwitchToClassic: () => void
}

export function VisionRedesign(props: VisionRedesignProps) {
  const {config, datasets, projectId, defaultDataset, onSwitchToClassic} = props
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const rootSize = useContentSize(rootElement)
  // Until measured, fall back to the viewport so the first paint is close to the final layout
  const layout = getVisionLayout(
    rootSize?.width || (typeof window === 'undefined' ? STACKED_BREAKPOINT : window.innerWidth),
  )

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
  const experience = useMemo(
    (): VisionExperience => ({layout, switchToClassic: onSwitchToClassic}),
    [layout, onSwitchToClassic],
  )
  const savedQueries = useSavedQueries()
  const [pendingEdits] = useState(createPendingEdits)
  const [tabDrawerElement, setTabDrawerElement] = useState<HTMLElement | null>(null)
  const tabDrawerSlot = useMemo(
    (): TabDrawerSlot => ({element: tabDrawerElement, setElement: setTabDrawerElement}),
    [tabDrawerElement],
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
                      className={styles.root}
                      data-testid="vision-root"
                      data-vision-layout={layout}
                      height="100%"
                      overflow="hidden"
                      ref={setRootElement}
                    >
                      <VisionSidebar />
                      <Flex
                        flexBasis="0%"
                        flexDirection="column"
                        flexGrow={1}
                        // Under a phone's full-width drawer the tabs area is covered and must not take focus
                        inert={layout === 'mobile' && openDrawer !== null}
                        minWidth="0"
                        overflow="hidden"
                      >
                        <QueryTabBar />
                        <QueryTabLayoutProvider>
                          {/*
                            Every tab stays mounted, so switching tabs hides one and shows another
                            rather than remounting it: a tab shown again keeps its elements and
                            its state, and its editors their selection, undo history and scroll
                          */}
                          {tabs.map((tab) => (
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
                    </Flex>
                    <VisionDialogs />
                    <VisionUrlState tab={activeTab} />
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
