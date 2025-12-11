import {Card, Code} from '@sanity/ui'
import {useMemo} from 'react'
import {useI18nText} from 'sanity'

import {Pane, usePaneRouter} from '../../components'
import {_DEBUG} from '../../constants'
import {type BaseStructureToolPaneProps} from '../types'
import {ListPaneContent} from './ListPaneContent'
import {ListPaneContext, type ListPaneContextValue} from './ListPaneContext'
import {ListPaneHeader} from './ListPaneHeader'

type ListPaneProps = BaseStructureToolPaneProps<'list'>

/**
 * @internal
 */
export function ListPane(props: ListPaneProps) {
  const {childItemId, index, isActive, isSelected, pane, paneKey} = props
  const {params} = usePaneRouter()

  const {defaultLayout, displayOptions, items, menuItems, menuItemGroups, views} = pane
  const showIcons = displayOptions?.showIcons !== false
  const {title} = useI18nText(pane)

  // Determine active view from URL params
  const activeViewId = params?.view ?? null

  // Create context value for list pane
  const listPaneContextValue: ListPaneContextValue = useMemo(
    () => ({
      activeViewId,
      views: views || [],
    }),
    [activeViewId, views],
  )

  return (
    <ListPaneContext.Provider value={listPaneContextValue}>
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
    </ListPaneContext.Provider>
  )
}
