import PropTypes from 'prop-types'
import React from 'react'
import Debug from 'debug'
import {omit} from 'lodash'

const debug = Debug('sanity-imagetool')
const supportsTouch = typeof window !== 'undefined' && 'ontouchstart' in window

// Returns a component that emits `onDragStart, `onDrag` and `onDragEnd` events.
// It handles mouse/touch events the same way
// - `onDragStart` is called with the {x, y} positions relative from the dom node (e.g. where the mousedown event happened)
// - `onDrag` and `onDragEnd` are both called with the {x, y} difference from the previous position
export default function makeDragAware(Component) {
  return class DragAware extends React.PureComponent {
    static propTypes = {
      onDragStart: PropTypes.func.isRequired,
      onDrag: PropTypes.func.isRequired,
      onDragEnd: PropTypes.func.isRequired,
      readOnly: PropTypes.bool,
    }

    currentPos = null
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
        document.body.removeEventListener('touchmove', this.handleTouchMove, {passive: false})
        document.body.removeEventListener('touchend', this.handleDragEnd, {passive: false})
        document.body.removeEventListener('touchcancel', this.handleDragCancel)
      } else {
        document.body.removeEventListener('mousemove', this.handleDrag)
        document.body.removeEventListener('mouseup', this.handleDragEnd)
        document.body.removeEventListener('mouseleave', this.handleDragCancel)
      }
    }

    handleTouchMove = (event) => {
      // Disables mobile scroll by touch
      if (this.isDragging) {
        event.preventDefault()
      }
    }

    handleDragStart = (event) => {
      const {onDragStart} = this.props

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

    handleDrag = (event) => {
      if (!this.isDragging) {
        return
      }
      const {onDrag} = this.props
      const nextPos = getPos(event)
      const diff = diffPos(nextPos, this.currentPos)
      onDrag(diff)
      debug('moving by %o', diff)
      this.currentPos = nextPos
    }

    handleDragEnd = (event) => {
      const {onDragEnd} = this.props
      if (!this.isDragging) {
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

    handleDragCancel = (event) => {
      if (!this.isDragging) {
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

    setDomNode = (node) => {
      this.domNode = node
    }

    render() {
      const {readOnly} = this.props
      return (
        <Component
          ref={this.setDomNode}
          onTouchStart={!readOnly && this.handleDragStart}
          onMouseDown={!readOnly && this.handleDragStart}
          onTouchMove={!readOnly && this.handleDrag}
          {...omit(this.props, ['onDragStart', 'onDragEnd', 'onDrag'])}
        />
      )
    }
  }
}

function getPositionRelativeToRect(x, y, rect) {
  return {
    x: x - rect.left,
    y: y - rect.top,
  }
}

function getPos(event) {
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

function diffPos(pos, otherPos) {
  return {
    x: pos.x - otherPos.x,
    y: pos.y - otherPos.y,
  }
}
