import type {Crop} from '../types'

export class Size {
  height: number
  width: number
  constructor(height: number, width: number) {
    this.height = height
    this.width = width
  }
}
export class Point {
  x: number
  y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

class HLine {
  y: number
  _left: number
  _right: number
  constructor(y: number, left: number, right: number) {
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
  rect: Rect
  constructor(rect: Rect) {
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
  left: number
  top: number
  width: number
  height: number
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static fromEdges({left, right, top, bottom}: Crop) {
    return new Rect(left, top, 1 - left - right, 1 - top - bottom)
  }

  constructor(left = 0, top = 0, width = 0, height = 0) {
    this.left = left
    this.top = top
    this.width = width
    this.height = height
  }

  setTopLeft(left: number | undefined, top: number | undefined): Rect {
    return new Rect(left, top, this.width || 0, this.height || 0)
  }

  setSize(width: number | undefined, height: number | undefined): Rect {
    return new Rect(this.left || 0, this.top || 0, width, height)
  }

  setCenter(x: number, y: number): Rect {
    const width = this.width || 0
    const height = this.height || 0
    return new Rect(x - width / 2, y - height / 2, width || 0, height || 0)
  }

  get center(): Point {
    return new Point(this.left + this.width / 2, this.top + this.height / 2)
  }

  get corners(): Corners {
    return new Corners(this)
  }

  get right(): number {
    return this.left + this.width
  }

  get bottom(): number {
    return this.top + this.height
  }

  multiply(rect: Rect): Rect {
    return new Rect(
      (this.left || 0) + this.width * rect.left,
      (this.top || 0) + this.height * rect.top,
      this.width * rect.width,
      this.height * rect.height,
    )
  }

  grow(delta: number): Rect {
    return new Rect(
      this.left - delta,
      this.top - delta,
      this.width + delta * 2,
      this.height + delta * 2,
    )
  }

  shrink(delta: number): Rect {
    return this.grow(-delta)
  }

  cropRelative(crop: Rect): Rect {
    const top = this.top + crop.top * this.height
    const left = this.left + crop.left * this.width
    const height = this.height * crop.height
    const width = this.width * crop.width
    return new Rect(left, top, width, height)
  }

  clamp(bounds: Rect): Rect {
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

    return new Rect(Math.max(left, bounds.left), Math.max(top, bounds.top), width, height)
  }
}
