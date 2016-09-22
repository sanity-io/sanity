export class Size {
  constructor(height, width) {
    this.height = height
    this.width = width
  }
}
export class Point {
  constructor(x, y) {
    this.x = x
    this.y = y
  }
}

class HLine {
  constructor(y, left, right) {
    this.y = y
    this._left = left
    this._right = right
  }

  get right() {
    return new Point(this._right, this.y)
  }

  get left() {
    return new Point(this._left, this.y)
  }

  get length() {
    return this._right - this._left
  }
}

class Corners {
  constructor(rect) {
    this.rect = rect
  }

  get top() {
    return new HLine(this.rect.top, this.rect.left, this.rect.right)
  }

  get bottom() {
    return new HLine(this.rect.bottom, this.rect.left, this.rect.right)
  }
}

export class Rect {

  static fromEdges({left, right, top, bottom}) {
    return new Rect(left, top, 1 - left - right, 1 - top - bottom)
  }

  constructor(left, top, width, height) {
    this.left = left
    this.top = top
    this.width = width
    this.height = height
  }

  setTopLeft(left, top) {
    return new Rect(left, top, this.width || 0, this.height || 0)
  }

  setSize(width, height) {
    return new Rect(this.left || 0, this.top || 0, width, height)
  }

  setCenter(x, y) {
    const width = this.width || 0
    const height = this.height || 0
    return new Rect(x - (width / 2), y - (height / 2), width || 0, height || 0)
  }

  get center() {
    return new Point(this.left + (this.width / 2), this.top + (this.height / 2))
  }

  get corners() {
    return new Corners(this)
  }

  get right() {
    return this.left + this.width
  }

  get bottom() {
    return this.top + this.height
  }

  multiply(rect) {
    return new Rect(
        (this.left || 0) + (this.width * rect.left),
        (this.top || 0) + (this.height * rect.top),
        this.width * rect.width,
        this.height * rect.height
    )
  }

  grow(delta) {
    return new Rect(this.left - delta, this.top - delta, this.width + (delta * 2), this.height + (delta * 2))
  }

  shrink(delta) {
    return this.grow(-delta)
  }

  cropRelative(crop) {
    const top = this.top + (crop.top * this.height)
    const left = this.left + (crop.left * this.width)
    const height = this.height * crop.height
    const width = this.width * crop.width
    return new Rect(left, top, width, height)
  }

  clamp(bounds) {
    // always try to fit the whole rect inside given bounds
    // adjust top, left if we can, resize if we must
    let {left, top, width, height} = this
    if (bounds.width < width) {
      width = bounds.width
      left = bounds.left
    }
    if (bounds.height < height) {
      height = bounds.height
      top = bounds.top
    }

    if (left + width > bounds.left + bounds.width) {
      left = bounds.right - width
    }

    if (top + height > bounds.top + bounds.height) {
      top = bounds.bottom - height
    }

    return new Rect(
        Math.max(left, bounds.left),
        Math.max(top, bounds.top),
        width,
        height
    )
  }
}
