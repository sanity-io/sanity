import {on, off} from 'dom-event'
import React, {PropTypes} from 'react'
import Debug from 'debug'
import omit from 'lodash.omit'

const debug = Debug('sanity-imagetool')

// Returns a component that emits `onDragStart, `onDrag` and `onDragEnd` events.
// It handles mouse/touch events the same way
// - `onDragStart` is called with the {x, y} positions relative from the dom node (e.g. where the mousedown event happened)
// - `onDrag` and `onDragEnd` are both called with the {x, y} difference from the previous position
export default function makeDragAware(Component) {
  return class DragAware extends React.Component {
    static propTypes = {
      onDragStart: PropTypes.func,
      onDrag: PropTypes.func,
      onDragEnd: PropTypes.func,
    }
    componentDidMount() {
      const {onDragStart, onDrag, onDragEnd} = this.props
      debug('Draggable component did mount')
      const win = getWindow()
      const supportsTouch = ('ontouchstart' in window)
      const domNode = this.domNode

      const EVENT_NAMES = {
        start: supportsTouch ? 'touchstart' : 'mousedown',
        move: supportsTouch ? 'touchmove' : 'mousemove',
        end: supportsTouch ? 'touchend' : 'mouseup'
      }

      let dragging = false
      let currentPos = null

      let moveListener
      let endListener

      const startListener = listen(win, EVENT_NAMES.start, handleMouseDown)

      this.getDisposables = () => {
        return [
          moveListener,
          endListener,
          startListener
        ]
      }

      function handleMouseDown(event) {
        if (dragging) {
          debug('Start cancelled, already a drag in progress')
          return
        }
        if (event.target !== domNode) {
           // Event happened outside of this dom node
          return
        }
        event.preventDefault()
        dragging = true
        const nextPos = getPos(event)
        debug('Drag started %o', nextPos)
        onDragStart(getPositionRelativeToRect(nextPos.x, nextPos.y, domNode.getBoundingClientRect()))
        moveListener = listen(win, EVENT_NAMES.move, handleMouseMove)
        endListener = listen(win, EVENT_NAMES.end, handleMouseUp)
        currentPos = nextPos
      }

      function handleMouseUp(event) {
        if (!dragging) {
          throw new Error('Got mouseup on a component that was not dragging.')
        }
        event.preventDefault()
        const nextPos = getPos(event)
        onDragEnd(getPositionRelativeToRect(nextPos.x, nextPos.y, domNode.getBoundingClientRect()))
        dragging = false
        currentPos = null

        moveListener.dispose()
        moveListener = null

        endListener.dispose()
        endListener = null

        debug('Done moving %o', nextPos)
      }

      function handleMouseMove(event) {
        event.preventDefault()
        const nextPos = getPos(event)
        const diff = diffPos(nextPos, currentPos)
        onDrag(diff)
        debug('moving by %o', diff)
        currentPos = nextPos
      }
    }

    componentWillUnmount() {
      debug('Disposing event listeners')
      this.getDisposables().filter(Boolean).forEach(disposable => disposable.dispose())
    }

    setDomNode = node => this.domNode = node

    render() {
      return <Component ref={this.setDomNode} {...omit(this.props, ['onDragStart', 'onDragEnd', 'onDrag'])} />
    }
  }
}

function getPositionRelativeToRect(x, y, rect) {
  return {
    x: x - rect.left,
    y: y - rect.top
  }
}

function getWindow() {
  /* global window */
  return typeof window === 'undefined' ? null : window
}

function getPos(event) {
  if (event instanceof TouchEvent) {
    return event.touches.length ? getPos(event.touches[0]) : {x: 0, y: 0}
  }
  return {
    x: event.clientX,
    y: event.clientY
  }
}

function diffPos(pos, otherPos) {
  return {
    x: pos.x - otherPos.x,
    y: pos.y - otherPos.y
  }
}

function listen(element, type, handler) {
  on(element, type, handler)
  return {
    dispose() {
      off(element, type, handler)
    }
  }
}
