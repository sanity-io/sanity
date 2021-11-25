import React, {createElement, isValidElement, useRef} from 'react'
import {isValidElementType} from 'react-is'
import {Pane} from '../../components/pane'
import {usePaneRouter} from '../../contexts/paneRouter'
import {DeskToolPaneActionHandler} from '../../types'
import {BaseDeskToolPaneProps} from '../types'
import {UserComponentPaneHeader} from './UserComponentPaneHeader'
import {UserComponentPaneContent} from './UserComponentPaneContent'

type UserComponentPaneProps = BaseDeskToolPaneProps<'component'>

/**
 * @internal
 */
export function UserComponentPane(props: UserComponentPaneProps) {
  const {index, pane, paneKey, ...restProps} = props
  const {params} = usePaneRouter()
  const {
    component,
    menuItems,
    menuItemGroups,
    title = '',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type: _unused,
    ...restPane
  } = pane
  const userComponent = useRef<{
    actionHandlers?: Record<string, DeskToolPaneActionHandler>
  } | null>(null)

  return (
    <Pane id={paneKey} minWidth={320} selected={restProps.isSelected}>
      <UserComponentPaneHeader
        actionHandlers={userComponent.current?.actionHandlers}
        index={index}
        menuItems={menuItems}
        menuItemGroups={menuItemGroups}
        title={title}
      />
      <UserComponentPaneContent>
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
      </UserComponentPaneContent>
    </Pane>
  )
}
