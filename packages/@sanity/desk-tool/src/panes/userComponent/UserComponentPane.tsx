import React, {createElement, isValidElement, useCallback, useRef} from 'react'
import {MenuItem, MenuItemGroup} from '@sanity/base/__legacy/@sanity/components'
import {Button} from '@sanity/ui'
import {isValidElementType} from 'react-is'
import {ArrowLeftIcon} from '@sanity/icons'
import {PaneContextMenuButton, Pane, PaneHeader} from '../../components/pane'
import {useDeskTool} from '../../contexts/deskTool'
import {BackLink} from '../../contexts/paneRouter'
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
  const {features} = useDeskTool()
  const {component, menuItems = [], menuItemGroups = [], title = ''} = pane
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
    <PaneContextMenuButton items={menuItems} itemGroups={menuItemGroups} onAction={handleAction} />
  )

  return (
    <Pane data-index={index} minWidth={320} selected={isSelected}>
      <PaneHeader
        actions={actions}
        backButton={
          features.backButton &&
          index > 0 && <Button as={BackLink} data-as="a" icon={ArrowLeftIcon} mode="bleed" />
        }
        title={title}
      />

      {isValidElementType(component) &&
        createElement(component, {...restProps, ref: userComponent})}

      {isValidElement(component) && component}
    </Pane>
  )
}
