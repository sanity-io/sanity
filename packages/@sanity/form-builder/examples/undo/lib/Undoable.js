export default class Undoable {
  constructor(value, prev, next) {
    this._value = value
    this._prev = prev
    this._next = next
  }

  set(nextValue) {
    return new Undoable(nextValue, this)
  }

  get() {
    return this._value
  }

  undo() {
    return new Undoable(this._prev._value, this._prev._prev, this)
  }

  redo() {
    return this._next
  }

  get canUndo() {
    return this._prev !== undefined
  }

  get canRedo() {
    return this._next !== undefined
  }
}
