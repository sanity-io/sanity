import {omit} from 'lodash'
import React, {useMemo} from 'react'
import {exclusiveParams, PaneRouterProvider} from '../contexts/paneRouter'
import {RouterPane, StructurePane} from '../types'
import {DocumentsListPane} from './documentsListPane'
import {UserComponentPane} from './userComponentPane'
import {UnknownPane} from './unknownPane'
import {DocumentPane} from './documentPane'
import {ListPane} from './listPane'
import {BaseDeskToolPaneProps} from './types'

interface DeskToolPaneProps {
  group: RouterPane[]
  groupIndexes: number[]
  i: number
  index: number
  pane: StructurePane
  paneKeys: string[]
  panes: StructurePane[]
  sibling: RouterPane
  siblingIndex: number
}

const paneMap: Record<
  string,
  React.ComponentType<BaseDeskToolPaneProps<StructurePane>> | undefined
> = {
  component: UserComponentPane,
  document: DocumentPane,
  documentList: DocumentsListPane,
  list: ListPane,
}

/**
 * @note The same pane might appear multiple times (split pane), so use index as tiebreaker
 *
 * @internal
 */
export function DeskToolPane(props: DeskToolPaneProps) {
  const {group, groupIndexes, i, index, pane, paneKeys, panes, sibling, siblingIndex} = props
  const groupRoot = group[0]
  const isDuplicate = siblingIndex > 0 && sibling.id === groupRoot.id
  const paneKey = `${pane.type || 'unknown'}-${paneKeys[i] || 'root'}-${groupIndexes[i - 1] || '0'}`
  const itemId = paneKeys[i]
  const childItemId = paneKeys[i + 1] || ''
  const rootParams = useMemo(() => omit(groupRoot.params || {}, exclusiveParams), [
    groupRoot.params,
  ])
  const params: Record<string, string> = useMemo(
    () => (isDuplicate ? {...rootParams, ...(sibling.params || {})} : sibling.params || {}),
    [isDuplicate, rootParams, sibling.params]
  )
  const payload = isDuplicate ? sibling.payload || groupRoot.payload : sibling.payload
  const isSelected = i === panes.length - 1
  const isActive = i === panes.length - 2
  const isClosable = siblingIndex > 0
  const PaneComponent = paneMap[pane.type] || UnknownPane

  return (
    <PaneRouterProvider
      flatIndex={i}
      index={index}
      params={params}
      payload={payload}
      siblingIndex={siblingIndex}
    >
      <PaneComponent
        childItemId={childItemId}
        index={i}
        itemId={itemId}
        isActive={isActive}
        isSelected={isSelected}
        isClosable={isClosable}
        // Use key to force rerendering pane on ID change
        key={paneKey}
        paneKey={paneKey}
        pane={pane}
        urlParams={params}
      />
    </PaneRouterProvider>
  )
}
