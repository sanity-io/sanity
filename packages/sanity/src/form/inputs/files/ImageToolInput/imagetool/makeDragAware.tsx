/* eslint-disable react/jsx-filename-extension */
import PropTypes from 'prop-types'
import React from 'react'
import Debug from 'debug'
import {FIXME} from './types'

const debug = Debug('sanity-imagetool')
const supportsTouch = typeof window !== 'undefined' && 'ontouchstart' in window

// Returns a component that emits `onDragStart, `onDrag` and `onDragEnd` events.
// It handles mouse/touch events the same way
// - `onDragStart` is called with the {x, y} positions relative from the dom node (e.g. where the mousedown event happened)
// - `onDrag` and `onDragEnd` are both called with the {x, y} difference from the previous position
export interface DragAwareProps {
  onDragStart: (pos: {x: number; y: number}) => void
  onDrag: (pos: {x: number; y: number}) => void
  onDragEnd: (pos: {x: number; y: number}) => void
  readOnly?: boolean
  [key: string]: FIXME
}
export function makeDragAware(Component: FIXME) {
  return class DragAware extends React.PureComponent<DragAwareProps> {
    static propTypes = {
      onDragStart: PropTypes.func.isRequired,
      onDrag: PropTypes.func.isRequired,
      onDragEnd: PropTypes.func.isRequired,
      readOnly: PropTypes.bool,
    }

    domNode: FIXME = null
    currentPos: FIXME = null
    isDragging = false

    componentDidMount() {
      if (supportsTouch) {
        document.body.addEventListener('touchmove', this.handleTouchMove, {passive: false})
        document.body.addEventListener('touchend', this.handleDragEnd)
        document.body.addEventListener('touchcancel', this.handleDragCancel)
      } else {
        document.body.addEventListener('mousemove', this.handleDrag)
        document.body.addEventListener('mouseup', this.handleDragEnd)
        document.body.addEventListener('mouseleave', this.handleDragCancel)
      }
    }

    componentWillUnmount() {
      if (supportsTouch) {
        document.body.removeEventListener('touchmove', this.handleTouchMove, {
          passive: false,
        } as FIXME)
        document.body.removeEventListener('touchend', this.handleDragEnd, {passive: false} as FIXME)
        document.body.removeEventListener('touchcancel', this.handleDragCancel)
      } else {
        document.body.removeEventListener('mousemove', this.handleDrag)
        document.body.removeEventListener('mouseup', this.handleDragEnd)
        document.body.removeEventListener('mouseleave', this.handleDragCancel)
      }
    }

    handleTouchMove = (event: {preventDefault: () => void}) => {
      // Disables mobile scroll by touch
      if (this.isDragging) {
        event.preventDefault()
      }
    }

    handleDragStart = (event: FIXME) => {
      const {onDragStart, readOnly} = this.props

      if (readOnly) {
        return
      }

      if (this.isDragging) {
        debug('Start cancelled, already a drag in progress')
        return
      }

      this.isDragging = true
      const nextPos = getPos(event)
      debug('Drag started %o', nextPos)
      onDragStart(
        getPositionRelativeToRect(nextPos.x, nextPos.y, this.domNode.getBoundingClientRect())
      )

      this.currentPos = nextPos
    }

    handleDrag = (event: FIXME) => {
      if (!this.isDragging || this.props.readOnly) {
        return
      }
      const {onDrag} = this.props
      const nextPos = getPos(event)
      const diff = diffPos(nextPos, this.currentPos)
      onDrag(diff)
      debug('moving by %o', diff)
      this.currentPos = nextPos
    }

    handleDragEnd = (event: FIXME) => {
      const {onDragEnd, readOnly} = this.props
      if (!this.isDragging || readOnly) {
        return
      }
      const nextPos = getPos(event)
      onDragEnd(
        getPositionRelativeToRect(nextPos.x, nextPos.y, this.domNode.getBoundingClientRect())
      )
      this.isDragging = false
      this.currentPos = null
      debug('Done moving %o', nextPos)
    }

    handleDragCancel = () => {
      if (!this.isDragging || this.props.readOnly) {
        return
      }
      const {onDragEnd} = this.props
      this.isDragging = false
      onDragEnd(
        getPositionRelativeToRect(
          this.currentPos.x,
          this.currentPos.y,
          this.domNode.getBoundingClientRect()
        )
      )
      this.currentPos = null
    }

    setDomNode = (node: FIXME) => {
      this.domNode = node
    }

    render() {
      const {readOnly, onDragStart, onDragEnd, onDrag, ...rest} = this.props
      return (
        <Component
          ref={this.setDomNode}
          onTouchStart={readOnly ? undefined : this.handleDragStart}
          onMouseDown={readOnly ? undefined : this.handleDragStart}
          onTouchMove={readOnly ? undefined : this.handleDrag}
          {...rest}
        />
      )
    }
  }
}

function getPositionRelativeToRect(x: number, y: number, rect: {left: number; top: number}) {
  return {
    x: x - rect.left,
    y: y - rect.top,
  }
}

function getPos(event: {touches: string | FIXME[]; clientX: FIXME; clientY: FIXME}) {
  if (supportsTouch) {
    return event.touches.length
      ? {x: event.touches[0].clientX, y: event.touches[0].clientY}
      : {x: 0, y: 0}
  }

  return {
    x: event.clientX,
    y: event.clientY,
  }
}

function diffPos(pos: {x: FIXME; y: FIXME}, otherPos: {x: number; y: number}) {
  return {
    x: pos.x - otherPos.x,
    y: pos.y - otherPos.y,
  }
}
