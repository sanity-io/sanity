import React, {memo} from 'react'
import {PaneRouterProvider} from '../contexts/paneRouter'
import {StructurePane} from '../types'
import {DocumentPane} from './document'
import {DocumentListPane} from './documentList'
import {ListPane} from './list'
import {BaseDeskToolPaneProps} from './types'
import {UnknownPane} from './unknown'
import {UserComponentPane} from './userComponent'

interface DeskToolPaneProps {
  active: boolean
  childItemId: string | null
  groupIndex: number
  index: number
  itemId: string
  pane: StructurePane
  paneKey: string
  params: Record<string, string>
  payload: unknown
  selected: boolean
  siblingIndex: number
}

const paneMap: Record<
  string,
  React.ComponentType<BaseDeskToolPaneProps<StructurePane>> | undefined
> = {
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
        pane={pane}
      />
    </PaneRouterProvider>
  )
})
