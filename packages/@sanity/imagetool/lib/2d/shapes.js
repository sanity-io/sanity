export class Size {
  constructor(height, width) {
    this.height = height;
    this.width = width;
  }
}
export class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Corners {
  constructor(rect) {
    this.rect = rect;
  }
  get top() {
    return new HLine(this.rect.top, this.rect.left, this.rect.right)
  }
  get bottom() {
    return new HLine(this.rect.bottom, this.rect.left, this.rect.right)
  }
}

class HLine {
  constructor(y, left, right) {
    this.y = y;
    this._left = left;
    this._right = right;
  }
  get right() {
    return new Point(this._right, this.y)
  }
  get left() {
    return new Point(this._left, this.y)
  }
  get length() {
    return this._right - this._left;
  }
}

export class Rect {

  constructor(left, top, width, height) {
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
  }

  setTopLeft(...args) {
    const [left, top] = args.length === 1 ? Array.isArray(args[0]) ? args[0] : [args[0].x, args[0].y] : args;
    return new Rect(left, top, this.width || 0, this.height || 0)
  }

  setSize(...args) {
    const [width, height] = args.length === 1 ? Array.isArray(args[0]) ? args[0] : [args[0].width, args[0].height] : args;
    return new Rect(this.left || 0, this.top || 0, width, height)
  }

  setCenter(...args) {
    const [x, y] = args.length === 1 ? Array.isArray(args[0]) ? args[0] : [args[0].x, args[0].y] : args;
    const width = this.width || 0;
    const height = this.height || 0;
    return new Rect(x - width / 2, y - height / 2, width || 0, height || 0)
  }

  get center() {
    return new Point(this.left + this.width / 2, this.top + this.height / 2);
  }

  get corners() {
    return new Corners(this)
  }

  get right() {
    return this.left + this.width;
  }

  get bottom() {
    return this.top + this.height;
  }

  multiply(rect) {
    return new Rect(
        this.left + this.width * rect.left,
        this.top + this.height * rect.top,
        this.width * rect.width,
        this.height * rect.height
    );
  }

  grow(delta) {
    return new Rect(this.left - delta, this.top - delta, this.width + delta * 2, this.height + delta * 2);
  }

  shrink(delta) {
    return this.grow(-delta)
  }
  crop(crop) {
    const newLeft = this.left + crop.left;
    const newTop = this.top + crop.top;
    return new Rect(newLeft, newTop, this.width - crop.right, this.height - crop.top)
  }
  cropRelative(crop) {
    const top = crop.top * this.height;
    const left = crop.left * this.width;
    const height = this.height - crop.bottom * this.height - top;
    const width = this.width - crop.right * this.width - left;
    return new Rect(left, top, width, height);
  }
}
