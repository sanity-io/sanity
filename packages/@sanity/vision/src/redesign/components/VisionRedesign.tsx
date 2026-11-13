import {TooltipDelayGroupProvider} from '@sanity/ui/tooltip'
import {useActorRef, useSelector} from '@xstate/react'
import {useMemo, useState, ViewTransition} from 'react'
import {Flex} from 'ui5'

import {useSavedQueries} from '../../hooks/useSavedQueries'
import {type VisionConfig} from '../../types'
import {useContentSize} from '../hooks/useContentSize'
import {useOnValueChange} from '../hooks/useOnValueChange'
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
import {DRAWER_TRANSITION, startLayoutTransition, TABS_AREA} from './panelTransitions'
import * as styles from './redesign.module.css'
import {RequestBottomPanelProvider} from './requestBottomPanel'
import {VisionSidebar} from './sidebar/VisionSidebar'
import {QueryTab} from './tabs/QueryTab'
import {QueryTabBar} from './tabs/QueryTabBar'
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
  const openDrawer = useSelector(actorRef, selectOpenDrawer)
  // Match VisionSidebar: the machine updates at once, the visible drawer follows in a transition
  const [shownDrawer, setShownDrawer] = useState(openDrawer)
  useOnValueChange(openDrawer, (next) => {
    startLayoutTransition(DRAWER_TRANSITION, () => setShownDrawer(next))
  })
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
                  <ViewTransition default={TABS_AREA}>
                    <Flex
                      flexBasis="0%"
                      flexDirection="column"
                      flexGrow={1}
                      // Under a phone's full-width drawer the tabs area is covered and must not take focus.
                      // Follow shownDrawer so inert does not land before the drawer mounts
                      inert={layout === 'mobile' && shownDrawer !== null}
                      minWidth="0"
                      overflow="hidden"
                    >
                      <QueryTabBar />
                      <RequestBottomPanelProvider>
                        <QueryTab key={activeTab.id} tab={activeTab} rootElement={rootElement} />
                      </RequestBottomPanelProvider>
                    </Flex>
                  </ViewTransition>
                </Flex>
                <VisionDialogs />
                <VisionUrlState tab={activeTab} />
                <VisionWebMcp tab={activeTab} />
              </TooltipDelayGroupProvider>
            </TabDrawerSlotContext.Provider>
          </PendingEditsContext.Provider>
        </SavedQueriesContext.Provider>
      </VisionExperienceContext.Provider>
    </VisionActorContext.Provider>
  )
}
