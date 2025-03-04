import {CheckmarkIcon, ChevronDownIcon} from '@sanity/icons'
import {Menu, TabList, useElementSize} from '@sanity/ui'
import {motion} from 'framer-motion'
import {type ComponentType, type ReactNode, useCallback, useState} from 'react'

import {Button, MenuButton, MenuItem, Tab} from '../../../../../ui-components'
import {usePaneRouter} from '../../../../components'
import {useDocumentPane} from '../../useDocumentPane'

function DelayedDiv({children, show}: {show: boolean; children: ReactNode}) {
  return (
    <motion.div
      key={show ? 'show' : 'wait'}
      initial={{opacity: show ? 1 : 0}}
      animate={{opacity: 1}}
      transition={
        show
          ? {duration: 0.2}
          : // We delay the showing the element to avoid flickering
            {delay: 1, duration: 0.2}
      }
    >
      {children}
    </motion.div>
  )
}

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
export function DocumentHeaderTabs({parentRef}: {parentRef: HTMLDivElement | null}) {
  const {activeViewId, paneKey, views} = useDocumentPane()

  const [tabList, setTabList] = useState<HTMLDivElement | null>(null)
  const parentSize = useElementSize(parentRef)
  const tabListSize = useElementSize(tabList)

  const parentWidth = parentSize?.border?.width ?? 0
  const tabListWidth = tabListSize?.border?.width ?? 0

  const tabPanelId = `${paneKey}tabpanel`
  const activeTab = views.find((view) => view.id === activeViewId)

  if (parentWidth < 480 || tabListWidth > 200) {
    return (
      <DelayedDiv
        // We immediately show the dropdown if the elements have been calculated
        show={Boolean(parentWidth + tabListWidth)}
      >
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
      </DelayedDiv>
    )
  }
  return (
    <DelayedDiv show={Boolean(tabListWidth)}>
      <TabList space={1} ref={setTabList}>
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
    </DelayedDiv>
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
