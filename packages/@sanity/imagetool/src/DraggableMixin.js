import SyntheticMouseEvent from 'react/lib/SyntheticMouseEvent';
import SyntheticTouchEvent from 'react/lib/SyntheticTouchEvent';
import {on, off} from "dom-event";
import Debug from "debug";

const debug = Debug('sanity-imagetool');

function getPositionRelativeToRect(x, y, rect) {
  return {
    x: x - rect.left,
    y: y - rect.top
  };
}

function getWindow() {
  /* global window */
  return typeof window === 'undefined' ? null : window;
}

function pool(type, handler) {
  return function handle(e) {
    handler(getPooledEvent(type, e))
  }
}

function createSyntheticEvent(type, event) {
  return SyntheticMouseEvent.getPooled({}, type, event);
}

// Todo: use symbol
const getDisposablesKey = '__DraggableMixin_disposables';

function getPos(event) {
  return {
    x: event.clientX,
    y: event.clientY
  };
}

function diffPos(pos, otherPos) {
  return {
    x: pos.x - otherPos.x,
    y: pos.y - otherPos.y
  }
}

function listen(element, type, handler) {
  on(element, type, _handler);

  return {
    dispose() {
      off(element, type, _handler);
    }
  };

  function _handler(e) {
    handler(createSyntheticEvent(type, e));
  }
}


module.exports = {
  componentDidMount() {
    debug('Draggable component did mount');
    const win = getWindow();
    const domNode = this.getDOMNode();

    const self = this;

    let dragging = false;
    let prevPos = null;

    let mouseMoveListener;
    let mouseUpListener;
    let mouseDownListener = listen(win, 'mousedown', start);
    let touchStartListener = listen(win, 'touchstart', start);

    self[getDisposablesKey] = function() {
      return [
        mouseMoveListener,
        mouseUpListener,
        mouseDownListener,
        touchStartListener
      ]
    };

    function start(event) {
      if (dragging) {
        debug('Start cancelled, already a drag in progress');
        return;
      }
      if  (event.target !== domNode) {
        return;
      }
      dragging = true;
      prevPos = getPos(event);
      debug('Drag started %o', prevPos);
      self.componentDidDragStart(getPositionRelativeToRect(prevPos.x, prevPos.y, domNode.getBoundingClientRect()));
      mouseMoveListener = listen(win, 'mousemove', move);
      mouseUpListener = listen(win, 'mouseup', end);
    }

    function end(event) {
      if (!dragging) {
        throw new Error("Got mouseup on a component that was not dragging.")
      }
      const pos = getPos(event);
      self.componentDidDragEnd(getPositionRelativeToRect(pos.x, pos.y, domNode.getBoundingClientRect()));
      dragging = false;
      prevPos = null;
      mouseMoveListener = mouseMoveListener.dispose();
      mouseUpListener = mouseUpListener.dispose();
      debug('Done moving %o', pos)
    }

    function move(e) {
      const pos = getPos(e);
      var diff = diffPos(pos, prevPos);
      self.componentDidDrag(diff);
      debug('moving by %o', diff);
      prevPos = pos;
    }
  },
  componentWillUnmount() {
    if (typeof self[getDisposablesKey] === 'function') {
      debug("Disposing event listeners");
      self[getDisposablesKey]().filter(Boolean).forEach(disposable => disposable.dispose());
    }
  }
};
