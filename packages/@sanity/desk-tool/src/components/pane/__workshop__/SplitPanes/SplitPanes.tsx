import {Flex, ToastProvider, PortalProvider} from '@sanity/ui'
import {useNumber} from '@sanity/ui-workshop'
import React, {useState, useCallback} from 'react'
import {PaneLayout} from '../../PaneLayout'
import {DocumentPane} from './DocumentPane'
import {ListPane} from './ListPane'
import {Navbar} from './Navbar'

export function SplitPanes() {
  //  knobs
  const panes = useNumber('Panes', 5, 'Props') || 0

  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const [layoutCollapsed, setLayoutCollapsed] = useState(false)

  const handleCollapse = useCallback(() => setLayoutCollapsed(true), [])
  const handleExpand = useCallback(() => setLayoutCollapsed(false), [])

  return (
    <ToastProvider paddingY={7} zOffset={[100, 11000]}>
      <PortalProvider element={portalElement}>
        <Flex
          direction="column"
          height={layoutCollapsed ? undefined : 'fill'}
          style={{minHeight: '100%'}}
        >
          <Navbar />

          <PaneLayout
            flex={1}
            height={layoutCollapsed ? undefined : 'fill'}
            minWidth={512}
            onCollapse={handleCollapse}
            onExpand={handleExpand}
          >
            {panes > 0 && <ListPane />}
            {panes > 1 && <ListPane />}
            {panes > 2 && <ListPane />}
            {panes > 3 && <ListPane />}
            {panes > 4 && <DocumentPane />}
          </PaneLayout>
        </Flex>
      </PortalProvider>

      <div data-portal="" ref={setPortalElement} style={{outline: '1px solid red'}} />
    </ToastProvider>
  )
}
