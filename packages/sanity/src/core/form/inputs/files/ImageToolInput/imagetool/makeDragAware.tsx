import React from 'react'
import Debug from 'debug'
import type {Coordinate} from './types'

const debug = Debug('sanity-imagetool')

type PositionableEvent = PointerEvent | React.PointerEvent<HTMLElement>

// Returns a component that emits `onDragStart, `onDrag` and `onDragEnd` events.
// Pointer events are used which handles mouse/touch events the same way.
// - `onDragStart` is called with the {x, y} positions relative from the dom node (e.g. where the pointerdown event happened)
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
      document.body.addEventListener('pointermove', this.handleDrag)
      document.body.addEventListener('pointerup', this.handleDragEnd)
      document.body.addEventListener('pointerleave', this.handleDragCancel)
      document.body.addEventListener('pointercancel', this.handleDragCancel)
    }

    componentWillUnmount() {
      document.body.removeEventListener('pointermove', this.handleDrag)
      document.body.removeEventListener('pointerup', this.handleDragEnd)
      document.body.removeEventListener('pointerleave', this.handleDragCancel)
      document.body.removeEventListener('pointercancel', this.handleDragCancel)
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
        getPositionRelativeToRect(nextPos.x, nextPos.y, this.domNode.getBoundingClientRect()),
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

    handleDragEnd = (event: PositionableEvent) => {
      const {onDragEnd, readOnly} = this.props
      if (!this.isDragging || readOnly || !this.domNode) {
        return
      }
      const nextPos = getPos(event)
      onDragEnd(
        getPositionRelativeToRect(nextPos.x, nextPos.y, this.domNode.getBoundingClientRect()),
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
          this.domNode.getBoundingClientRect(),
        ),
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
          onPointerDown={readOnly ? undefined : this.handleDragStart}
          onPointerMove={readOnly ? undefined : this.handleDrag}
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
