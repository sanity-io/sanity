// @flow

import type {SlateValue} from '../typeDefs'
import type {Node} from 'react'
import React from 'react'

type Props = {
  children: Node,
  editorValue: SlateValue,
  onAction: void => void
}

// The purpose of this component is to prevent the editor of loosing
// focus when the toolbarbuttons are clicked, because this makes selecting
// bold etc difficult. We want to keep the cursor blinking in the editor...

export default function ToolBarClickAction(props: Props) {
  const originalSelection = props.editorValue.selection
  let executed = false
  const onMouseDown = (event: SyntheticMouseEvent<*>) => {
    // Only for left button
    if (event.buttons !== 1) {
      return
    }
    executed = true
    event.preventDefault()
    event.stopPropagation()
    // This is a workaround to prevent other mousehandlers to pick up this action
    // To illustrate the problem, try to remove the timeout and try to create an annotation
    // This event will then trigg the CaptureOutsideClicks handler for the popover.
    // Not sure why this happens exactly when the event is set to preventDefault og stopPropagation
    // TODO: maybe find a more elegant solution
    setTimeout(() => {
      props.onAction(originalSelection)
    }, 300)
  }

  // Fallback for button click events with keyboard
  const onClick = (event: SyntheticMouseEvent<*>) => {
    if (executed) {
      return
    }
    props.onAction(originalSelection)
  }

  return (
    <span onMouseDown={onMouseDown} onClick={onClick}>
      {props.children}
    </span>
  )
}
