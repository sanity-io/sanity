import {Menu, MenuDivider} from '@sanity/ui/menu'
import {type ReactNode, useId} from 'react'
import {ContextMenuButton} from 'sanity'

import {MenuButton} from '../../../ui-components/menuButton/MenuButton'
import {type PopoverProps} from '../../../ui-components/popover/Popover'
import {PaneMenuButtonItem} from './PaneMenuButtonItem'
import {type _PaneMenuItem, type _PaneMenuNode} from './types'

interface PaneContextMenuButtonProps {
  nodes: _PaneMenuNode[]
  actionsNodes?: ReactNode
  /**
   * PROPOSED: entries drawn last, after `actionsNodes` (Copy and Paste document). With it set, `actionsNodes` move from the top of the menu to
   * just above these.
   */
  trailingNodes?: _PaneMenuNode[]
}

const CONTEXT_MENU_POPOVER_PROPS: PopoverProps = {
  constrainSize: true,
  placement: 'bottom',
  portal: true,
}

function nodesHasTone(nodes: _PaneMenuNode[], tone: NonNullable<_PaneMenuItem['tone']>): boolean {
  return nodes.some((node) => {
    return (
      (node.type === 'item' && node.tone === tone) ||
      (node.type === 'group' && nodesHasTone(node.children, tone))
    )
  })
}

/**
 *
 * @hidden
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export function PaneContextMenuButton(props: PaneContextMenuButtonProps) {
  const {nodes, actionsNodes, trailingNodes} = props
  const id = useId()

  const hasCritical = nodesHasTone(nodes, 'critical')
  const hasCaution = nodesHasTone(nodes, 'caution')

  return (
    <MenuButton
      button={
        <ContextMenuButton
          tone={hasCritical ? 'critical' : hasCaution ? 'caution' : undefined}
          data-testid="pane-context-menu-button"
        />
      }
      id={id}
      menu={
        <Menu>
          {actionsNodes && !trailingNodes && (
            <>
              {actionsNodes}
              <MenuDivider />
            </>
          )}
          {nodes.map((node, nodeIndex) => {
            const isAfterGroup = nodes[nodeIndex - 1]?.type === 'group'
            return <PaneMenuButtonItem key={node.key} isAfterGroup={isAfterGroup} node={node} />
          })}
          {trailingNodes && (
            <>
              {actionsNodes && (
                <>
                  <MenuDivider />
                  {actionsNodes}
                </>
              )}
              {trailingNodes.length > 0 && <MenuDivider />}
              {trailingNodes.map((node) => (
                <PaneMenuButtonItem key={node.key} isAfterGroup={false} node={node} />
              ))}
            </>
          )}
        </Menu>
      }
      popover={CONTEXT_MENU_POPOVER_PROPS}
    />
  )
}
