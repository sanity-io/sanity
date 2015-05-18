import SyntheticMouseEvent from 'react/lib/SyntheticMouseEvent';
import SyntheticTouchEvent from 'react/lib/SyntheticTouchEvent';

function getPositionRelativeToRect(x, y, rect) {
  return {
    x: x - rect.left,
    y: y - rect.top
  };
}

// TODO: Implement without using Rx
import Rx from "rx";


function getWindow() {
  /* global window */
  return typeof window === 'undefined' ? null : window;
}

module.exports = {
  componentDidMount() {
    const win = getWindow();

    const mousedowns = Rx.Observable.fromEvent(win, 'mousedown').map(e => {
      return SyntheticMouseEvent.getPooled({}, 'mousedown', e);
    });

    const mouseups = Rx.Observable.fromEvent(win, 'mouseup').map(e => {
      return SyntheticMouseEvent.getPooled({}, 'mouseup', e);
    });

    const mousemoves = Rx.Observable.fromEvent(win, 'mousemove').map(e => {
      return SyntheticMouseEvent.getPooled({}, 'mousemove', e);
    });

    const touchstarts = Rx.Observable.fromEvent(win, 'touchstart').map(e => {
      return SyntheticTouchEvent.getPooled({}, 'touchstart', e);
    });

    const dragstarts = mousedowns.merge(touchstarts).throttle();

    const domNode = this.getDOMNode();

    const _dragstarts = dragstarts
      .filter(e => e.target == domNode)
      .map(e => ({
        x: e.clientX,
        y: e.clientY
      }));

    const _moves = mousemoves.map(e => ({
      x: e.clientX,
      y: e.clientY
    }));

    const _drags = _dragstarts.flatMap(startPos => {
      const prevPos = startPos;
      return _moves
        .map(pos => {
          const delta = {x: pos.x - prevPos.x, y: pos.y - prevPos.y};
          prevPos.x = pos.x;
          prevPos.y = pos.y;
          return delta;
        })
        .takeUntil(mouseups);
    });

    const _dragends = mouseups.map(e => ({
      x: e.clientX,
      y: e.clientY
    }));

    this._disposables = [];
    this._disposables.push(_dragstarts.subscribe(pos => {
      this.componentDidDragStart(getPositionRelativeToRect(pos.x, pos.y, domNode.getBoundingClientRect()))
    }));

    this._disposables.push(_drags.subscribe(pos => {
      this.componentDidDrag(pos);
    }));

    this._disposables.push(_dragends.subscribe(pos => {
      this.componentDidDragEnd(getPositionRelativeToRect(pos.x, pos.y, domNode.getBoundingClientRect()))
    }));

  },
  componentWillUnmount() {
    this._disposables.map(o => o.dispose());
  }
};
