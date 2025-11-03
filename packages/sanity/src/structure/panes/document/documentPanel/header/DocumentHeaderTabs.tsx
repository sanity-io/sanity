import {TabList} from '@sanity/ui'
import {type ComponentType, type ReactNode, useCallback} from 'react'

import {Tab} from '../../../../../ui-components'
import {usePaneRouter} from '../../../../components'
import {useDocumentPane} from '../../useDocumentPane'

/**
 * This component will render the tabs for the document pane, following this rules:
 *  if the view tabs are wider than 200px it collapses to a dropdown
 *  if the header is smaller than 480px it collapses to a dropdown
 * For this we need to first measure the pane header width and then the tabs width.
 *
 * Gotcha, if the tabs are wider han 200px it renders a dropdown and if then the tabs change to be smaller than 200px
 * it will not change back to tabs, this is a limitation of the current implementation but an ok tradeoff to avoid mounting
 * ghost elements just to measure the width.
 */
export function DocumentHeaderTabs() {
  const {activeViewId, paneKey, views} = useDocumentPane()

  const tabPanelId = `${paneKey}tabpanel`

  return (
    <TabList gap={1}>
      {views.map((view, index) => (
        <DocumentHeaderTab
          key={view.id}
          icon={view.icon}
          id={`${paneKey}tab-${view.id}`}
          isActive={activeViewId === view.id}
          label={view.title}
          tabPanelId={tabPanelId}
          viewId={index === 0 ? null : (view.id ?? null)}
        />
      ))}
    </TabList>
  )
}

function DocumentHeaderTab(props: {
  icon?: ComponentType | ReactNode
  id: string
  isActive: boolean
  label: string
  tabPanelId: string
  viewId: string | null
}) {
  const {icon, id, isActive, label, tabPanelId, viewId, ...rest} = props
  const {ready, editState} = useDocumentPane()
  const {setView} = usePaneRouter()
  const handleClick = useCallback(() => setView(viewId), [setView, viewId])

  return (
    <Tab
      {...rest} // required to enable <TabList> keyboard navigation
      aria-controls={tabPanelId}
      disabled={!ready && !editState?.draft && !editState?.published}
      icon={icon}
      id={id}
      label={label}
      onClick={handleClick}
      selected={isActive}
    />
  )
}
