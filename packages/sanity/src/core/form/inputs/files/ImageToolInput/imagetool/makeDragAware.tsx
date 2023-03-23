import React from 'react'
import Debug from 'debug'
import {supportsTouch} from '../../../../../util'
import type {Coordinate} from './types'

const debug = Debug('sanity-imagetool')

type PositionableEvent =
  | {touches: React.TouchEvent['touches'] | TouchEvent['touches']}
  | {clientX: number; clientY: number}

// Returns a component that emits `onDragStart, `onDrag` and `onDragEnd` events.
// It handles mouse/touch events the same way
// - `onDragStart` is called with the {x, y} positions relative from the dom node (e.g. where the mousedown event happened)
// - `onDrag` and `onDragEnd` are both called with the {x, y} difference from the previous position
export interface DragAwareProps {
  onDragStart: (pos: {x: number; y: number}) => void
  onDrag: (pos: {x: number; y: number}) => void
  onDragEnd: (pos: {x: number; y: number}) => void
  readOnly?: boolean
  [key: string]: unknown | undefined
}

export function makeDragAware(Component: 'canvas') {
  return class DragAware extends React.PureComponent<DragAwareProps> {
    domNode: HTMLCanvasElement | null = null
    currentPos: Coordinate | null = null
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
        document.body.removeEventListener('touchmove', this.handleTouchMove)
        document.body.removeEventListener('touchend', this.handleDragEnd)
        document.body.removeEventListener('touchcancel', this.handleDragCancel)
      } else {
        document.body.removeEventListener('mousemove', this.handleDrag)
        document.body.removeEventListener('mouseup', this.handleDragEnd)
        document.body.removeEventListener('mouseleave', this.handleDragCancel)
      }
    }

    handleTouchMove = (event: TouchEvent | MouseEvent) => {
      // Disables mobile scroll by touch
      if (this.isDragging) {
        event.preventDefault()
      }
    }

    handleDragStart = (event: PositionableEvent) => {
      const {onDragStart, readOnly} = this.props

      if (readOnly || !this.domNode) {
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

    handleDrag = (event: PositionableEvent) => {
      if (!this.isDragging || this.props.readOnly || !this.currentPos) {
        return
      }

      const {onDrag} = this.props
      const nextPos = getPos(event)
      const diff = diffPos(nextPos, this.currentPos)
      onDrag(diff)
      debug('moving by %o', diff)
      this.currentPos = nextPos
    }

    handleDragEnd = (event: MouseEvent | TouchEvent) => {
      const {onDragEnd, readOnly} = this.props
      if (!this.isDragging || readOnly || !this.domNode) {
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
      if (!this.isDragging || this.props.readOnly || !this.currentPos || !this.domNode) {
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

    setDomNode = (node: HTMLCanvasElement) => {
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

function getPos(event: PositionableEvent): Coordinate {
  if ('touches' in event) {
    return event.touches.length > 0
      ? {x: event.touches[0].clientX, y: event.touches[0].clientY}
      : {x: 0, y: 0}
  }

  return {
    x: event.clientX,
    y: event.clientY,
  }
}

function diffPos(pos: Coordinate, otherPos: Coordinate): Coordinate {
  return {
    x: pos.x - otherPos.x,
    y: pos.y - otherPos.y,
  }
}
