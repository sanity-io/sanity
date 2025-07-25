import {Card, Code} from '@sanity/ui'
import {useI18nText} from 'sanity'

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
        key={paneKey}
        childItemId={childItemId}
        isActive={isActive}
        items={items}
        layout={defaultLayout}
        showIcons={showIcons}
        title={title}
      />
    </Pane>
  )
}
