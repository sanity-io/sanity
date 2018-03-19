import React from 'react'
import PropTypes from 'prop-types'

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
  return React.createElement(props.tagName, EVENT_PROPS, props.children)
}
StopPropagation.defaultProps = {
  tagName: 'div'
}
StopPropagation.propTypes = {
  children: PropTypes.node,
  tagName: PropTypes.oneOf(['span', 'div'])
}
