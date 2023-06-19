import React, {createElement} from 'react'
import {isValidElementType} from 'react-is'
import {BaseDeskToolPaneProps} from '../types'
import {UserComponentProps} from '../../structureBuilder'

/** @internal */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UserComponentPaneProps extends BaseDeskToolPaneProps<'component'> {
  //
}

/**
 * @internal
 */
export function UserComponentPane(props: UserComponentPaneProps) {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    index,
    pane,
    paneKey,
    ...restProps
  } = props
  const {
    component,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type: _unused,
    ...restPane
  } = pane

  if (!isValidElementType(component)) {
    return <>Not a valid pane component</>
  }

  const paneProps: UserComponentProps = {...restProps, ...restPane, paneKey}

  return createElement(component, paneProps)
}
