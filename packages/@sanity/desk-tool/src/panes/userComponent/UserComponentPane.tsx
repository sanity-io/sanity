import React, {createElement, isValidElement, useRef} from 'react'
import {MenuItem, MenuItemGroup} from '@sanity/base/__legacy/@sanity/components'
import {isValidElementType} from 'react-is'
import {Pane} from '../../components/pane'
import {usePaneRouter} from '../../contexts/paneRouter'
import {BaseDeskToolPaneProps} from '../types'
import {DeskToolPaneActionHandler} from '../../types'
import {UserComponentPaneHeader} from './UserComponentPaneHeader'

type UserComponentPaneProps = BaseDeskToolPaneProps<{
  id: string
  type: 'component'
  component: React.ComponentType | React.ReactNode
  menuItems?: MenuItem[]
  menuItemGroups?: MenuItemGroup[]
  options: Record<string, unknown>
  title: string
}>

/**
 * @internal
 */
export function UserComponentPane(props: UserComponentPaneProps) {
  const {index, isSelected, pane, ...restProps} = props
  const {params} = usePaneRouter()
  const {component, menuItems, menuItemGroups, title = '', type, ...restPane} = pane
  const userComponent = useRef<{
    actionHandlers?: Record<string, DeskToolPaneActionHandler>
  } | null>(null)

  return (
    <Pane data-index={index} minWidth={320} selected={isSelected}>
      <UserComponentPaneHeader
        actionHandlers={userComponent.current?.actionHandlers}
        index={index}
        menuItems={menuItems}
        menuItemGroups={menuItemGroups}
        title={title}
      />

      {isValidElementType(component) &&
        createElement(component, {
          // this forces a re-render when the router panes change. note: in
          // theory, this shouldn't be necessary and the downstream user
          // component could internally handle these updates, but this was done
          // to preserve older desk tool behavior
          key: `${restProps.itemId}-${restProps.childItemId}`,
          ...restProps,
          ...restPane,
          ref: userComponent,
          // NOTE: this is for backwards compatibility (<= 2.20.0)
          urlParams: params,
        })}

      {isValidElement(component) && component}
    </Pane>
  )
}
