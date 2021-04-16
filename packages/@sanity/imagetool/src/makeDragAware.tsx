import React, { ReactHTML } from "react";
import Debug from 'debug'
import {Point} from './2d/shapes'

const debug = Debug('sanity-imagetool')
const supportsTouch = typeof window !== 'undefined' && 'ontouchstart' in window

function isTouchEvent(event: Event): event is TouchEvent {
  return 'touches' in event
}

interface Props {
  onDragStart: (event: {x: number; y: number}) => void
  onDrag: (event: {x: number; y: number}) => void
  onDragEnd: (event: {x: number; y: number}) => void
  readOnly?: boolean
}

// Returns a component that emits `onDragStart, `onDrag` and `onDragEnd` events.
// It handles mouse/touch events the same way
// - `onDragStart` is called with the {x, y} positions relative from the dom node (e.g. where the mousedown event happened)
// - `onDrag` and `onDragEnd` are both called with the {x, y} difference from the previous position
export default function makeDragAware<InnerProps>(Component: 'canvas') {
  return class DragAware extends React.PureComponent<Props & InnerProps> {
    currentPos: Point | null = null
    isDragging = false
    domNode?: HTMLElement | null

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
        document.body.removeEventListener('touchmove', this.handleTouchMove)
        document.body.removeEventListener('touchend', this.handleDragEnd)
        document.body.removeEventListener('touchcancel', this.handleDragCancel)
      } else {
        document.body.removeEventListener('mousemove', this.handleDrag)
        document.body.removeEventListener('mouseup', this.handleDragEnd)
        document.body.removeEventListener('mouseleave', this.handleDragCancel)
      }
    }

    handleTouchMove = (event: TouchEvent) => {
      // Disables mobile scroll by touch
      if (this.isDragging) {
        event.preventDefault()
      }
    }

    handleDragStart = (event: React.TouchEvent | React.MouseEvent) => {
      const {onDragStart} = this.props

      if (this.isDragging) {
        debug('Start cancelled, already a drag in progress')
        return
      }

      this.isDragging = true
      const nextPos = getPos(event)
      debug('Drag started %o', nextPos)
      onDragStart(
        getPositionRelativeToRect(nextPos.x, nextPos.y, this.domNode!.getBoundingClientRect())
      )

      this.currentPos = nextPos
    }

    handleDrag = (event: TouchEvent | DragEvent | MouseEvent | React.TouchEvent) => {
      if (!this.isDragging) {
        return
      }
      const {onDrag} = this.props
      const nextPos = getPos(event)
      if (!this.currentPos) {
        throw new Error('Expected currentPos to be set')
      }
      const diff = diffPos(nextPos, this.currentPos)
      onDrag(diff)
      debug('moving by %o', diff)
      this.currentPos = nextPos
    }

    handleDragEnd = (event: TouchEvent | DragEvent | MouseEvent) => {
      const {onDragEnd} = this.props
      if (!this.isDragging) {
        return
      }
      const nextPos = getPos(event)
      onDragEnd(
        getPositionRelativeToRect(nextPos.x, nextPos.y, this.domNode!.getBoundingClientRect())
      )
      this.isDragging = false
      this.currentPos = null
      debug('Done moving %o', nextPos)
    }

    handleDragCancel = (event: TouchEvent | DragEvent | MouseEvent) => {
      if (!this.isDragging || !this.currentPos) {
        return
      }
      const {onDragEnd} = this.props
      this.isDragging = false
      onDragEnd(
        getPositionRelativeToRect(
          this.currentPos.x,
          this.currentPos.y,
          this.domNode!.getBoundingClientRect()
        )
      )
      this.currentPos = null
    }

    setDomNode = (node: HTMLElement | null) => {
      this.domNode = node
    }

    render() {
      const {readOnly, onDrag, onDragStart, onDragEnd, ...rest} = this.props
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

function getPositionRelativeToRect(x: number, y: number, rect: DOMRect) {
  return {
    x: x - rect.left,
    y: y - rect.top,
  }
}

function getPos(event: TouchEvent | MouseEvent) {
  if (isTouchEvent(event)) {
    return event.touches.length
      ? {x: event.touches[0].clientX, y: event.touches[0].clientY}
      : {x: 0, y: 0}
  }

  return {
    x: event.clientX,
    y: event.clientY,
  }
}

function diffPos(pos: Point, otherPos: Point) {
  return {
    x: pos.x - otherPos.x,
    y: pos.y - otherPos.y,
  }
}
