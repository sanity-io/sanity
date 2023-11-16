import {EllipsisHorizontalIcon} from '@sanity/icons'
import {Menu, MenuButton, PopoverProps} from '@sanity/ui'
import React, {useId} from 'react'
import {_PaneMenuItem, _PaneMenuNode} from './types'
import {PaneMenuButtonItem} from './PaneMenuButtonItem'
import {StatusButton} from 'sanity'

interface PaneContextMenuButtonProps {
  nodes: _PaneMenuNode[]
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
  const {nodes} = props
  const id = useId()

  const hasCritical = nodesHasTone(nodes, 'critical')
  const hasCaution = nodesHasTone(nodes, 'caution')

  return (
    <MenuButton
      button={
        <StatusButton
          icon={EllipsisHorizontalIcon}
          mode="bleed"
          // eslint-disable-next-line no-nested-ternary
          tone={hasCritical ? 'critical' : hasCaution ? 'caution' : undefined}
          tooltipProps={{
            content: 'Show more',
            placement: 'bottom',
            portal: true,
          }}
        />
      }
      id={id}
      menu={
        <Menu>
          {nodes.map((node, nodeIndex) => {
            const isAfterGroup = nodes[nodeIndex - 1]?.type === 'group'

            return <PaneMenuButtonItem isAfterGroup={isAfterGroup} key={node.key} node={node} />
          })}
        </Menu>
      }
      popover={CONTEXT_MENU_POPOVER_PROPS}
    />
  )
}
