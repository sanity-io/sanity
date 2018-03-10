import React from 'react'

const stop = e => e.stopPropagation()

const STOP_EVENTS = [
  'onClick',
  'onContextMenu',
  'onDoubleClick',
  'onDrag',
  'onDragEnd',
  'onDragEnter',
  'onDragExit',
  'onDragLeave',
  'onDragOver',
  'onDragStart',
  'onDrop',
  'onMouseDown',
  'onMouseEnter',
  'onMouseLeave',
  'onMouseOver',
  'onMouseOut',
  /*
  * don't stop propagation of these as some child components may be listening on document.body for mouseup to
  * mark the end of a drag gesture. E.g. sliders, etc.
  */
  // 'onMouseUp',
  // 'onMouseMove',
  'onKeyDown',
  'onKeyPress',
  'onKeyUp',
  'onFocus',
  'onBlur',
  'onChange',
  'onInput',
  'onInvalid',
  'onSubmit'
]

const EVENT_PROPS = STOP_EVENTS.reduce((props, event) => {
  props[event] = stop
  return props
}, {})

export default function StopPropagation(props) {
  return <div {...EVENT_PROPS}>{props.children}</div>
}
