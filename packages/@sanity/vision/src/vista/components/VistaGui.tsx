import {useActorRef, useSelector} from '@xstate/react'
import {useMemo, useState} from 'react'
import {Flex} from 'ui5'

import {useSavedQueries} from '../../hooks/useSavedQueries'
import {type VisionConfig} from '../../types'
import {useContentSize} from '../hooks/useContentSize'
import {
  SavedQueriesContext,
  usePersistVistaState,
  VistaActorContext,
  type VistaExperience,
  VistaExperienceContext,
  type VistaLayout,
} from '../store/VistaActorContext'
import {selectActiveTab, selectOpenDrawer, vistaMachine} from '../store/vistaMachine'
import {loadVistaState, type VistaStorageDefaults} from '../store/vistaStorage'
import {VistaSidebar} from './sidebar/VistaSidebar'
import {QueryTab} from './tabs/QueryTab'
import {QueryTabBar} from './tabs/QueryTabBar'
import {root} from './vista.css'
import {VistaDialogs} from './VistaDialogs'

/** Below this width the request and response columns stack */
const STACKED_BREAKPOINT = 900
/** Below this width one column shows at a time and the sidebar floats over the content */
const MOBILE_BREAKPOINT = 600

export function getVistaLayout(width: number): VistaLayout {
  if (width < MOBILE_BREAKPOINT) return 'mobile'
  if (width < STACKED_BREAKPOINT) return 'stacked'
  return 'columns'
}

export interface VistaGuiProps {
  config: VisionConfig
  datasets: string[]
  projectId: string
  defaultDataset: string
  onSwitchToClassic: () => void
}

export function VistaGui(props: VistaGuiProps) {
  const {config, datasets, projectId, defaultDataset, onSwitchToClassic} = props
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const rootSize = useContentSize(rootElement)
  // Until measured, fall back to the viewport so the first paint is close to the final layout
  const layout = getVistaLayout(
    rootSize?.width || (typeof window === 'undefined' ? STACKED_BREAKPOINT : window.innerWidth),
  )

  const defaults = useMemo(
    (): VistaStorageDefaults => ({
      datasets,
      defaultDataset,
      defaultApiVersion: `${config.defaultApiVersion}`,
    }),
    [datasets, defaultDataset, config.defaultApiVersion],
  )

  // `useActorRef` reads the input once, on mount, so the persisted state is loaded right then
  const [persisted] = useState(() => loadVistaState(projectId, defaults))
  const actorRef = useActorRef(vistaMachine, {input: {projectId, persisted, defaults}})
  usePersistVistaState(actorRef, projectId)

  const activeTab = useSelector(actorRef, selectActiveTab)
  const openDrawer = useSelector(actorRef, selectOpenDrawer)
  const experience = useMemo(
    (): VistaExperience => ({layout, switchToClassic: onSwitchToClassic}),
    [layout, onSwitchToClassic],
  )
  const savedQueries = useSavedQueries()

  return (
    <VistaActorContext.Provider value={actorRef}>
      <VistaExperienceContext.Provider value={experience}>
        <SavedQueriesContext.Provider value={savedQueries}>
          <Flex
            className={root}
            data-testid="vista-root"
            data-vista-layout={layout}
            height="100%"
            overflow="hidden"
            ref={setRootElement}
          >
            <VistaSidebar />
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
              <QueryTab key={activeTab.id} tab={activeTab} rootElement={rootElement} />
            </Flex>
          </Flex>
          <VistaDialogs />
        </SavedQueriesContext.Provider>
      </VistaExperienceContext.Provider>
    </VistaActorContext.Provider>
  )
}
