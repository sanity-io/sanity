import React, {memo} from 'react'
import {PaneNode} from '../types'
import {PaneRouterProvider} from '../contexts/paneRouter'
import {DocumentPane} from './document'
import {DocumentListPane} from './documentList'
import {ListPane} from './list'
import {UnknownPane} from './unknown'
import {UserComponentPane} from './userComponent'

interface DeskToolPaneProps {
  active: boolean
  childItemId: string | null
  groupIndex: number
  index: number
  itemId: string
  pane: PaneNode
  paneKey: string
  params: Record<string, string>
  payload: unknown
  selected: boolean
  siblingIndex: number
}

const paneMap = {
  component: UserComponentPane,
  document: DocumentPane,
  documentList: DocumentListPane,
  list: ListPane,
}

/**
 * @note The same pane might appear multiple times (split pane), so use index as tiebreaker
 *
 * @internal
 */
export const DeskToolPane = memo(function DeskToolPane(props: DeskToolPaneProps) {
  const {
    active,
    childItemId,
    groupIndex,
    index,
    itemId,
    pane,
    paneKey,
    params,
    payload,
    selected,
    siblingIndex,
  } = props

  const PaneComponent = paneMap[pane.type] || UnknownPane

  return (
    <PaneRouterProvider
      flatIndex={index}
      index={groupIndex}
      params={params}
      payload={payload}
      siblingIndex={siblingIndex}
    >
      <PaneComponent
        childItemId={childItemId || ''}
        index={index}
        itemId={itemId}
        isActive={active}
        isSelected={selected}
        paneKey={paneKey}
        // @ts-expect-error TS doesn't know how to handle this intersection
        pane={pane}
      />
    </PaneRouterProvider>
  )
})
