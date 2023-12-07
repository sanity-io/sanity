import React from 'react'
import {Card, Code} from '@sanity/ui'
import {Pane} from '../../components'
import {BaseDeskToolPaneProps} from '../types'
import {_DEBUG} from '../../constants'
import {ListPaneHeader} from './ListPaneHeader'
import {ListPaneContent} from './ListPaneContent'
import {useI18nText} from 'sanity'

type ListPaneProps = BaseDeskToolPaneProps<'list'>

/**
 * @internal
 */
export function ListPane(props: ListPaneProps) {
  const {childItemId, index, isActive, isSelected, pane, paneKey} = props

  const {defaultLayout, displayOptions, items, menuItems, menuItemGroups} = pane
  const showIcons = displayOptions?.showIcons !== false
  const {title} = useI18nText(pane)

  return (
    <Pane
      currentMaxWidth={350}
      data-testid="desk-tool-list-pane"
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
