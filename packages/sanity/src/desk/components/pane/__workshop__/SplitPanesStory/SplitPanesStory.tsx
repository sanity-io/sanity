import {Flex, ToastProvider, PortalProvider} from '@sanity/ui'
import React, {useState, useCallback} from 'react'
import {useBoolean} from '@sanity/ui-workshop'
import {PaneLayout} from '../../PaneLayout'
import {DocumentPane} from './DocumentPane'
import {ListPane} from './ListPane'
import {Navbar} from './Navbar'
import {panes} from './config'

export function SplitPanesStory() {
  const debug = useBoolean('Debug', false) || false
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const [layoutCollapsed, setLayoutCollapsed] = useState(false)
  const [path, setPath] = useState(['root'])

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
          <Navbar path={path} setPath={setPath} />

          <DeskTool
            collapsed={layoutCollapsed}
            onExpand={handleExpand}
            onCollapse={handleCollapse}
            path={path}
            setPath={setPath}
          />
        </Flex>
      </PortalProvider>

      <div data-portal="" ref={setPortalElement} style={{outline: '1px solid red'}} />
    </ToastProvider>
  )
}

function DeskTool(props: {
  collapsed: boolean
  onExpand: () => void
  onCollapse: () => void
  path: string[]
  setPath: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const {collapsed, onCollapse, onExpand, path, setPath} = props

  return (
    <PaneLayout
      flex={1}
      height={collapsed ? undefined : 'fill'}
      minWidth={600}
      onCollapse={onCollapse}
      onExpand={onExpand}
    >
      {path.map((s, i) => {
        const key = `${s}-${i}`
        const pane = panes.find((p) => p.id === s)

        if (!pane) {
          return <div key={key}>not found: {s}</div>
        }

        if (pane.type === 'list') {
          return (
            <ListPane
              active={i === path.length - 2}
              childId={path[i + 1]}
              index={i}
              key={key}
              node={pane}
              setPath={setPath}
            />
          )
        }

        return <DocumentPane index={i} key={key} node={pane} setPath={setPath} />
      })}
    </PaneLayout>
  )
}
