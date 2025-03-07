import {Card, Code} from '@sanity/ui'
import {useEffect} from 'react'
import {useI18nText, useMCPEmitter} from 'sanity'

import {Pane} from '../../components'
import {_DEBUG} from '../../constants'
import {type BaseStructureToolPaneProps} from '../types'
import {ListPaneContent} from './ListPaneContent'
import {ListPaneHeader} from './ListPaneHeader'

type ListPaneProps = BaseStructureToolPaneProps<'list'>

/**
 * @internal
 */
export function ListPane(props: ListPaneProps) {
  const {childItemId, index, isActive, isSelected, pane, paneKey} = props

  const {defaultLayout, displayOptions, items, menuItems, menuItemGroups} = pane
  const showIcons = displayOptions?.showIcons !== false
  const {title} = useI18nText(pane)
  const emitMCPEvent = useMCPEmitter()
  useEffect(() => {
    emitMCPEvent({
      type: 'UPDATE_PANE',
      paneType: 'list',
      id: pane.id,
      index,
      active: Boolean(isActive),
      pane,
    })
    return () => {
      emitMCPEvent({
        type: 'REMOVE_PANE',
        id: pane.id,
      })
    }
  }, [emitMCPEvent, index, isActive, pane])

  return (
    <Pane
      currentMaxWidth={350}
      data-testid="structure-tool-list-pane"
      data-ui="ListPane"
      id={paneKey}
      maxWidth={640}
      minWidth={320}
      selected={isSelected}
    >
      {_DEBUG && (
        <Card padding={4} tone="transparent">
          <Code>{pane.source || '(none)'}</Code>
        </Card>
      )}

      <ListPaneHeader
        index={index}
        menuItems={menuItems}
        menuItemGroups={menuItemGroups}
        title={title}
      />

      <ListPaneContent
        childItemId={childItemId}
        isActive={isActive}
        items={items}
        layout={defaultLayout}
        key={paneKey}
        showIcons={showIcons}
        title={title}
      />
    </Pane>
  )
}
