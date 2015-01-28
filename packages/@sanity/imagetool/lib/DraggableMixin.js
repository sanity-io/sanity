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

var mousedowns = Rx.Observable.fromEvent(window, 'mousedown').map(e => {
  return SyntheticMouseEvent.getPooled({}, 'mousedown', e);
});

var mouseups = Rx.Observable.fromEvent(window, 'mouseup').map(e => {
  return SyntheticMouseEvent.getPooled({}, 'mouseup', e);
});

var mousemoves = Rx.Observable.fromEvent(window, 'mousemove').map(e => {
  return SyntheticMouseEvent.getPooled({}, 'mousemove', e);
});

var touchstarts = Rx.Observable.fromEvent(window, 'touchstart').map(e => {
  return SyntheticTouchEvent.getPooled({}, 'touchstart', e);
});

var dragstarts = mousedowns.merge(touchstarts).throttle();

module.exports = {
  componentDidMount() {
    var domNode = this.getDOMNode();

    var _dragstarts = dragstarts
      .filter(e => e.target == domNode)
      .map(e => ({
        x: e.clientX,
        y: e.clientY
      }));

    var _moves = mousemoves.map(e => ({
      x: e.clientX,
      y: e.clientY
    }));

    var _drags = _dragstarts.flatMap(startPos => {
      var prevPos = startPos;
      return _moves
        .map(pos => {
          var delta = {x: pos.x - prevPos.x, y: pos.y - prevPos.y};
          prevPos.x = pos.x;
          prevPos.y = pos.y;
          return delta;
        })
        .takeUntil(mouseups);
    });

    var _dragends = mouseups.map(e => ({
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