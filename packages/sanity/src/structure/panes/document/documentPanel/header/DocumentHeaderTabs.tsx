import {CheckmarkIcon, ChevronDownIcon} from '@sanity/icons'
import {Menu, TabList} from '@sanity/ui'
import {type ComponentType, type ReactNode, useCallback} from 'react'

import {Button, MenuButton, MenuItem, Tab} from '../../../../../ui-components'
import {usePaneRouter} from '../../../../components'
import {useDocumentPane} from '../../useDocumentPane'

export function DocumentHeaderTabs({type = 'default'}: {type: 'default' | 'dropdown'}) {
  const {activeViewId, paneKey, views} = useDocumentPane()
  const tabPanelId = `${paneKey}tabpanel`
  const activeTab = views.find((view) => view.id === activeViewId)

  if (type === 'dropdown') {
    return (
      <MenuButton
        id={`${paneKey}tab-menu`}
        popover={{
          placement: 'bottom-end',
          portal: true,
        }}
        button={<Button iconRight={ChevronDownIcon} mode="bleed" text={activeTab?.title ?? ''} />}
        menu={
          <Menu>
            {views.map((view, index) => (
              <DocumentHeaderMenuItem
                icon={view.icon}
                id={`${paneKey}tab-${view.id}`}
                isActive={activeViewId === view.id}
                key={view.id}
                label={view.title}
                tabPanelId={tabPanelId}
                viewId={index === 0 ? null : (view.id ?? null)}
              />
            ))}
          </Menu>
        }
      />
    )
  }
  return (
    <TabList space={1}>
      {views.map((view, index) => (
        <DocumentHeaderTab
          icon={view.icon}
          id={`${paneKey}tab-${view.id}`}
          isActive={activeViewId === view.id}
          key={view.id}
          label={view.title}
          tabPanelId={tabPanelId}
          viewId={index === 0 ? null : (view.id ?? null)}
        />
      ))}
    </TabList>
  )
}

function DocumentHeaderMenuItem(props: {
  icon?: ComponentType | ReactNode
  id: string
  isActive: boolean
  label: string
  tabPanelId: string
  viewId: string | null
}) {
  const {icon, id, isActive, label, tabPanelId, viewId} = props
  const {ready, editState} = useDocumentPane()
  const {setView} = usePaneRouter()
  const handleClick = useCallback(() => setView(viewId), [setView, viewId])

  return (
    <MenuItem
      aria-controls={tabPanelId}
      disabled={!ready && !editState?.draft && !editState?.published}
      icon={icon}
      id={id}
      text={label}
      onClick={handleClick}
      selected={isActive}
      pressed={isActive}
      iconRight={isActive ? CheckmarkIcon : undefined}
    />
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
