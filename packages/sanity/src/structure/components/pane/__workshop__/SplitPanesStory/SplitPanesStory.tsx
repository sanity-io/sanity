import {Flex, PortalProvider, ToastProvider, useTheme} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import {type Dispatch, type SetStateAction, useCallback, useState} from 'react'

import {PaneLayout} from '../../PaneLayout'
import {panes} from './config'
import {DocumentPane} from './DocumentPane/DocumentPane'
import {ListPane} from './ListPane/ListPane'
import {Navbar} from './Navbar'

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

          <StructureTool
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

function StructureTool(props: {
  collapsed: boolean
  onExpand: () => void
  onCollapse: () => void
  path: string[]
  setPath: Dispatch<SetStateAction<string[]>>
}) {
  const {collapsed, onCollapse, onExpand, path, setPath} = props

  const {
    sanity: {media},
  } = useTheme()

  return (
    <PaneLayout
      flex={1}
      height={collapsed ? undefined : 'fill'}
      minWidth={media[1]}
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
              key={key}
              active={i === path.length - 2}
              childId={path[i + 1]}
              index={i}
              node={pane}
              setPath={setPath}
            />
          )
        }

        return <DocumentPane key={key} index={i} node={pane} setPath={setPath} />
      })}
    </PaneLayout>
  )
}
