import {Menu, MenuDivider} from '@sanity/ui'
import {type ReactNode, useId} from 'react'
import {ContextMenuButton} from 'sanity'

import {MenuButton, type PopoverProps} from '../../../ui-components'
import {partitionMenuNodesByRank} from '../../menuNodes'
import {PaneMenuButtonItem} from './PaneMenuButtonItem'
import {type _PaneMenuItem, type _PaneMenuNode} from './types'

interface PaneContextMenuButtonProps {
  nodes: _PaneMenuNode[]
  actionsNodes?: ReactNode
}

const CONTEXT_MENU_POPOVER_PROPS: PopoverProps = {
  constrainSize: true,
  placement: 'bottom-end',
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

function renderNodes(nodes: _PaneMenuNode[]) {
  return nodes.map((node, nodeIndex) => {
    const isAfterGroup = nodes[nodeIndex - 1]?.type === 'group'
    return <PaneMenuButtonItem key={node.key} isAfterGroup={isAfterGroup} node={node} />
  })
}

/**
 * The single overflow (`...`) menu of a pane scope. Renders the resolved
 * menu nodes by rank: secondary nodes first, then a divider, then
 * destructive nodes. Renders nothing when there is nothing to show.
 *
 * @hidden
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export function PaneContextMenuButton(props: PaneContextMenuButtonProps) {
  const {nodes, actionsNodes} = props
  const id = useId()

  const hasCritical = nodesHasTone(nodes, 'critical')
  const hasCaution = nodesHasTone(nodes, 'caution')

  const {secondary, destructive} = partitionMenuNodesByRank(nodes)

  // Nothing to overflow: don't render a dead trigger.
  if (nodes.length === 0 && !actionsNodes) return null

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
          {actionsNodes && (
            <>
              {actionsNodes}
              <MenuDivider />
            </>
          )}
          {renderNodes(secondary)}
          {secondary.length > 0 && destructive.length > 0 && <MenuDivider />}
          {renderNodes(destructive)}
        </Menu>
      }
      popover={CONTEXT_MENU_POPOVER_PROPS}
    />
  )
}
