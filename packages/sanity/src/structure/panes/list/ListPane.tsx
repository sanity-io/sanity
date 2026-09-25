import {Card} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {useI18nText} from 'sanity'

import {Pane} from '../../components/pane/Pane'
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

  const {
    currentMaxWidth = 350,
    defaultLayout,
    displayOptions,
    items,
    maxWidth = 640,
    menuItems,
    menuItemGroups,
    minWidth = 320,
  } = pane
  const showIcons = displayOptions?.showIcons !== false
  const {title} = useI18nText(pane)

  return (
    <Pane
      currentMaxWidth={currentMaxWidth}
      data-testid="structure-tool-list-pane"
      data-ui="ListPane"
      id={paneKey}
      maxWidth={maxWidth}
      minWidth={minWidth}
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
