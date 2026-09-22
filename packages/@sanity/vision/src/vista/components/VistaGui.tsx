import {useActorRef, useSelector} from '@xstate/react'
import {useMemo, useRef, useState} from 'react'
import {Flex} from 'ui5'

import {type VisionConfig} from '../../types'
import {usePersistVistaState, VistaActorContext} from '../store/VistaActorContext'
import {selectActiveTab, vistaMachine} from '../store/vistaMachine'
import {loadVistaState, type VistaStorageDefaults} from '../store/vistaStorage'
import {VistaSidebar} from './sidebar/VistaSidebar'
import {QueryTab} from './tabs/QueryTab'
import {QueryTabBar} from './tabs/QueryTabBar'
import {root} from './vista.css'
import {VistaDialogs} from './VistaDialogs'

export interface VistaGuiProps {
  config: VisionConfig
  datasets: string[]
  projectId: string
  defaultDataset: string
}

export function VistaGui(props: VistaGuiProps) {
  const {config, datasets, projectId, defaultDataset} = props
  const rootRef = useRef<HTMLDivElement | null>(null)

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

  return (
    <VistaActorContext.Provider value={actorRef}>
      <Flex className={root} data-testid="vista-root" height="100%" overflow="hidden" ref={rootRef}>
        <VistaSidebar datasets={datasets} />
        <Flex flexBasis="0%" flexDirection="column" flexGrow={1} minWidth="0" overflow="hidden">
          <QueryTabBar />
          <QueryTab key={activeTab.id} tab={activeTab} rootRef={rootRef} projectId={projectId} />
        </Flex>
      </Flex>
      <VistaDialogs datasets={datasets} />
    </VistaActorContext.Provider>
  )
}
