import React, {createElement, isValidElement, useState} from 'react'
import {isValidElementType} from 'react-is'
import {Pane, usePaneRouter} from '../../components'
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
    child,
    component,
    menuItems,
    menuItemGroups,
    title = '',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type: _unused,
    ...restPane
  } = pane
  const [ref, setRef] = useState<{
    actionHandlers?: Record<string, DeskToolPaneActionHandler>
  } | null>(null)

  return (
    <Pane id={paneKey} minWidth={320} selected={restProps.isSelected}>
      <UserComponentPaneHeader
        actionHandlers={ref?.actionHandlers}
        index={index}
        menuItems={menuItems}
        menuItemGroups={menuItemGroups}
        title={title}
      />

      <UserComponentPaneContent>
        {isValidElementType(component) &&
          createElement(component, {
            ...restProps,
            ...restPane,
            // NOTE: here we're utilizing the function form of refs so setting
            // the ref causes a re-render for `UserComponentPaneHeader`
            ...({ref: setRef} as any),
            child: child as any, // @todo: Fix typings
            paneKey,
            // NOTE: this is for backwards compatibility (<= 2.20.0)
            urlParams: params,
          })}

        {isValidElement(component) && component}
      </UserComponentPaneContent>
    </Pane>
  )
}
