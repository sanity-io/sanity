export type Merger<T> = (left: T, right: T) => T | [T, T]

/**
 * The two ended array supports pushing both at the beginning and
 * at the end while preserving indicies.
 */
export class TwoEndedArray<T extends {index: number}> {
  private _postive: T[] = []
  private _negative: T[] = []

  addToEnd(elem: T): void {
    elem.index = this._postive.length
    this._postive.push(elem)
  }

  addToBeginning(elem: T): void {
    // Prefer to place things at the positive side if possible.
    if (this.length == 0) {
      this.addToEnd(elem)
      return
    }

    elem.index = -(this._negative.length + 1)
    this._negative.push(elem)
  }

  mergeAtEnd(value: T, merger: Merger<T>): void {
    if (this.length === 0) {
      this.addToEnd(value)
      return
    }

    const idx = this.lastIdx
    const result = merger(this.get(idx), value)
    if (Array.isArray(result)) {
      this.set(idx, result[0])
      this.addToEnd(result[1])
    } else {
      this.set(idx, result)
    }
  }

  mergeAtBeginning(value: T, merger: Merger<T>): void {
    if (this.length === 0) {
      this.addToEnd(value)
      return
    }

    const idx = this.firstIdx
    const result = merger(value, this.get(idx))
    if (Array.isArray(result)) {
      this.set(idx, result[1])
      this.addToBeginning(result[0])
    } else {
      this.set(idx, result)
    }
  }

  removeFromEnd(): void {
    if (this._postive.length === 0) {
      this._negative.shift()
    } else {
      this._postive.pop()
    }
  }

  has(idx: number): boolean {
    if (idx >= 0) {
      return idx < this._postive.length
    }

    return -(idx + 1) < this._negative.length
  }

  get(idx: number): T {
    if (idx >= 0) {
      return this._postive[idx]
    }

    return this._negative[-(idx + 1)]
  }

  set(idx: number, value: T): void {
    if (idx >= 0) {
      value.index = idx
      this._postive[idx] = value
    } else {
      value.index = idx
      this._negative[-(idx + 1)] = value
    }
  }

  get lastIdx(): number {
    // Note: This also works correctly when _positive is empty (it returns -1)
    return this._postive.length - 1
  }

  get last(): T {
    return this.get(this.lastIdx)
  }

  get firstIdx(): number {
    // Note: This also works correctly when _negative is empty (it returns 0)
    return -this._negative.length
  }

  get first(): T {
    return this.get(this.firstIdx)
  }

  get length(): number {
    return this._postive.length + this._negative.length
  }
}
