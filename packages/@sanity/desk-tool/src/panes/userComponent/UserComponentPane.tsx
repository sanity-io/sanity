import React, {createElement, isValidElement, useCallback, useRef, useState} from 'react'
import {MenuItem, MenuItemGroup} from '@sanity/base/__legacy/@sanity/components'
import {isValidElementType} from 'react-is'
import {PaneContextMenuButton, Pane, PaneHeader} from '../../components/pane'
import {BaseDeskToolPaneProps} from '../types'
import {DeskToolPaneActionHandler} from '../../types'

type UserComponentPaneProps = BaseDeskToolPaneProps<{
  type: 'component'
  component: React.ComponentType | React.ReactNode
  menuItems?: MenuItem[]
  menuItemGroups?: MenuItemGroup[]
  title?: string
}>

/**
 * @internal
 */
export function UserComponentPane(props: UserComponentPaneProps) {
  const {index, isSelected, pane, ...restProps} = props
  const {component, menuItems = [], menuItemGroups = [], title = ''} = pane
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const userComponent = useRef<{
    actionHandlers?: Record<string, DeskToolPaneActionHandler>
  } | null>(null)

  const handleAction = useCallback((item: MenuItem) => {
    let handler: MenuItem['action'] | null = null

    if (typeof item.action === 'function') {
      handler = item.action
    } else if (typeof item.action === 'string') {
      handler =
        userComponent.current &&
        userComponent.current.actionHandlers &&
        userComponent.current.actionHandlers[item.action]
    }

    if (typeof handler === 'function') {
      handler(item.params)
    } else {
      // eslint-disable-next-line no-console
      console.warn('No handler defined for action:', item.action)
    }
  }, [])

  const actions = menuItems.length > 0 && (
    <PaneContextMenuButton
      boundaryElement={rootElement}
      items={menuItems}
      itemGroups={menuItemGroups}
      onAction={handleAction}
    />
  )

  return (
    <Pane data-index={index} minWidth={320} selected={isSelected} ref={setRootElement}>
      <PaneHeader actions={actions} title={title} />

      {isValidElementType(component) &&
        createElement(component, {...restProps, ref: userComponent})}

      {isValidElement(component) && component}
    </Pane>
  )
}
