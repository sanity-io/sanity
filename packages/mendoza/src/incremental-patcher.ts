/* eslint-disable max-statements */
/* eslint-disable yoda */
/* eslint-disable default-case */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-else-return */
/* eslint-disable no-lonely-if */
/* eslint-disable prefer-const */
import {ObjectModel} from './object-model'
import {RawPatch} from './patch'
import {Patcher} from './internal-patcher'
import {utf8charSize, utf8stringSize, commonPrefix, commonSuffix} from './utf8'

// The incremental patcher allows you to apply multiple patches and tracks the history of every element.
// It also allows you to extract a simple diff between the documents.

export type Value<T> = {
  data?: unknown
  content?: Content<T>
  startMeta: T
  endMeta: T
}

export type Type = 'array' | 'string' | 'object' | 'number' | 'boolean' | 'null'

export type Content<T> = ObjectContent<T> | ArrayContent<T> | StringContent<T>

export type ObjectContent<T> = {
  type: 'object'
  fields: {[key: string]: Value<T>}
}

export type ArrayContent<T> = {
  type: 'array'
  elements: Value<T>[]
  metas: T[]
}

export type StringContent<T> = {
  type: 'string'
  parts: StringPart<T>[]
}

export type StringPart<T> = {
  value: string
  utf8size: number
  uses: StringContent<T>[]
  startMeta: T
  endMeta: T
}

class Model<T>
  implements ObjectModel<Value<T>, StringContent<T>, ObjectContent<T>, ArrayContent<T>> {
  private meta: T

  constructor(meta: T) {
    this.meta = meta
  }

  wrap(data: unknown): Value<T> {
    return this.wrapWithMeta(data, this.meta, this.meta)
  }

  wrapWithMeta(data: unknown, startMeta: T, endMeta: T = this.meta): Value<T> {
    return {data, startMeta, endMeta}
  }

  asObject(value: Value<T>): ObjectContent<T> {
    if (!value.content) {
      let fields: ObjectContent<T>['fields'] = {}
      for (let [key, val] of Object.entries(value.data as any)) {
        fields[key] = this.wrapWithMeta(val, value.startMeta)
      }
      value.content = {type: 'object', fields}
    }

    return value.content as ObjectContent<T>
  }

  asArray(value: Value<T>): ArrayContent<T> {
    if (!value.content) {
      let elements = (value.data as unknown[]).map((item) =>
        this.wrapWithMeta(item, value.startMeta)
      )
      let metas = elements.map(() => this.meta)
      value.content = {type: 'array', elements, metas}
    }

    return value.content as ArrayContent<T>
  }

  asString(value: Value<T>): StringContent<T> {
    if (!value.content) {
      let str = value.data as string

      let part: StringPart<T> = {
        value: str,
        utf8size: utf8stringSize(str),
        uses: [],
        startMeta: value.startMeta,
        endMeta: value.endMeta,
      }
      value.content = this.stringFromParts([part])
    }

    return value.content as StringContent<T>
  }

  stringFromParts(parts: StringPart<T>[]): StringContent<T> {
    let str: StringContent<T> = {
      type: 'string',
      parts,
    }

    for (let part of parts) {
      part.uses.push(str)
    }

    return str
  }

  objectGetKeys(value: Value<T>): string[] {
    if (value.content) {
      return Object.keys((value.content as ObjectContent<T>).fields)
    } else {
      return Object.keys(value.data as any)
    }
  }

  objectGetField(value: Value<T>, key: string): Value<T> {
    let obj = this.asObject(value)
    return obj.fields[key]
  }

  arrayGetElement(value: Value<T>, idx: number): Value<T> {
    let arr = this.asArray(value)
    return arr.elements[idx]
  }

  finalize(content: Content<T>): Value<T> {
    this.updateEndMeta(content)
    return {content, startMeta: this.meta, endMeta: this.meta}
  }

  markChanged(value: Value<T>): Value<T> {
    return this.wrap(unwrap(value))
  }

  updateEndMeta(content: Content<T>) {
    if (content.type == 'string') {
      for (let part of content.parts) {
        part.endMeta = this.meta
      }
    } else {
      if (content.type === 'array') {
        for (let val of content.elements) {
          if (val.content && val.endMeta !== this.meta) {
            this.updateEndMeta(val.content)
          }
          val.endMeta = this.meta
        }
      } else {
        for (let val of Object.values(content.fields)) {
          if (val.content && val.endMeta !== this.meta) {
            this.updateEndMeta(val.content)
          }
          val.endMeta = this.meta
        }
      }
    }
  }

  copyString(value: Value<T> | null): StringContent<T> {
    if (value) {
      let other = this.asString(value)
      return this.stringFromParts(other.parts.slice())
    } else {
      return {
        type: 'string',
        parts: [],
      }
    }
  }

  copyObject(value: Value<T> | null): ObjectContent<T> {
    let obj: ObjectContent<T> = {
      type: 'object',
      fields: {},
    }

    if (value) {
      let other = this.asObject(value)
      Object.assign(obj.fields, other.fields)
    }

    return obj
  }

  copyArray(value: Value<T> | null): ArrayContent<T> {
    let arr = value ? this.asArray(value) : null
    let elements = arr ? arr.elements : []
    let metas = arr ? arr.metas : []

    return {
      type: 'array',
      elements,
      metas,
    }
  }

  objectSetField(target: ObjectContent<T>, key: string, value: Value<T>): void {
    target.fields[key] = value
  }

  objectDeleteField(target: ObjectContent<T>, key: string): void {
    delete target.fields[key]
  }

  arrayAppendValue(target: ArrayContent<T>, value: Value<T>): void {
    target.elements.push(value)
    target.metas.push(this.meta)
  }

  arrayAppendSlice(target: ArrayContent<T>, source: Value<T>, left: number, right: number): void {
    let arr = this.asArray(source)
    let samePosition = arr.elements.length === left

    target.elements.push(...arr.elements.slice(left, right))

    if (samePosition) {
      target.metas.push(...arr.metas.slice(left, right))
    } else {
      for (let i = left; i < right; i++) {
        target.metas.push(this.meta)
      }
    }
  }

  stringAppendValue(target: StringContent<T>, value: Value<T>): void {
    let str = this.asString(value)
    for (let part of str.parts) {
      this.stringAppendPart(target, part)
    }
  }

  stringAppendPart(target: StringContent<T>, part: StringPart<T>): void {
    target.parts.push(part)
    part.uses.push(target)
  }

  resolveStringPart(str: StringContent<T>, from: number, len: number): number {
    if (len === 0) return from

    for (let i = from; i < str.parts.length; i++) {
      let part = str.parts[i]

      if (len === part.utf8size) {
        // Matches perfect!
        return i + 1
      }

      if (len < part.utf8size) {
        // It's a part of this chunk. We now need to split it up.
        this.splitString(part, len)
        return i + 1
      }

      len -= part.utf8size
    }

    throw new Error('splitting string out of bounds')
  }

  splitString(part: StringPart<T>, idx: number) {
    let leftValue
    let rightValue
    let leftSize = idx
    let rightSize = part.utf8size - leftSize

    // idx is here in UTF-8 index, not codepoint index.
    // This means we might to adjust for multi-byte characters.
    if (part.utf8size !== part.value.length) {
      let byteCount = 0

      for (idx = 0; byteCount < leftSize; idx++) {
        let code = part.value.codePointAt(idx)!
        let size = utf8charSize(code)
        if (size === 4) idx++ // Surrogate pair.
        byteCount += size
      }
    }

    leftValue = part.value.slice(0, idx)
    rightValue = part.value.slice(idx)

    let newPart: StringPart<T> = {
      value: rightValue,
      utf8size: rightSize,
      uses: part.uses.slice(),
      startMeta: part.startMeta,
      endMeta: part.endMeta,
    }

    part.value = leftValue
    part.utf8size = leftSize

    for (let use of part.uses) {
      // Insert the new part.
      let idx = use.parts.indexOf(part)
      if (idx === -1) throw new Error('bug: mismatch between string parts and use.')
      use.parts.splice(idx + 1, 0, newPart)
    }
  }

  stringAppendSlice(target: StringContent<T>, source: Value<T>, left: number, right: number): void {
    let str = this.asString(source)
    let firstPart = this.resolveStringPart(str, 0, left)
    let lastPart = this.resolveStringPart(str, firstPart, right - left)

    for (let i = firstPart; i < lastPart; i++) {
      let part = str.parts[i]
      this.stringAppendPart(target, part)
    }
  }
}

// Turns a native JavaScript object into a Value with a given origin.
export function wrap<T>(data: unknown, meta: T): Value<T> {
  return {data, startMeta: meta, endMeta: meta}
}

// Converts a Value into a native JavaScript type.
export function unwrap<T>(value: Value<T>): unknown {
  if (typeof value.data !== 'undefined') return value.data

  let result: any
  let content = value.content!
  switch (content.type) {
    case 'string':
      result = content.parts.map((part) => part.value).join('')
      break
    case 'array':
      result = content.elements.map((val) => unwrap(val))
      break
    case 'object': {
      result = {}
      for (let [key, val] of Object.entries(content.fields)) {
        result[key] = unwrap(val)
      }
    }
  }

  value.data = result
  return result
}

// Returns the type of a Value.
export function getType<T>(value: Value<T>): Type {
  if (value.content) return value.content.type
  if (Array.isArray(value.data!)) return 'array'
  if (value.data === null) return 'null'

  return typeof value.data as Type
}

// Updates the `right` value such that it reuses as much as possible from the `left` value.
export function rebaseValue<T>(left: Value<T>, right: Value<T>): Value<T> {
  let leftType = getType(left)
  let rightType = getType(right)
  if (leftType !== rightType) return right

  let leftModel = new Model(left.endMeta)
  let rightModel = new Model(right.endMeta)

  switch (leftType) {
    case 'object': {
      let leftObj = leftModel.asObject(left)
      let rightObj = rightModel.asObject(right)

      // Number of fields which are identical in left and right.
      let identicalFieldCount = 0
      let leftFieldCount = Object.keys(leftObj.fields).length
      let rightFieldCount = Object.keys(rightObj.fields).length

      for (let [key, rightVal] of Object.entries(rightObj.fields)) {
        let leftVal = leftObj.fields[key]
        if (leftVal) {
          rightObj.fields[key] = rebaseValue(leftVal, rightVal)
          if (rightObj.fields[key] === leftVal) {
            identicalFieldCount++
          }
        }
      }

      let isIdentical = leftFieldCount === rightFieldCount && leftFieldCount === identicalFieldCount
      return isIdentical ? left : right
    }
    case 'array': {
      let leftArr = leftModel.asArray(left)
      let rightArr = rightModel.asArray(right)

      if (leftArr.elements.length !== rightArr.elements.length) {
        break
      }

      let numRebased = 0
      for (let i = 0; i < rightArr.elements.length; i++) {
        rightArr.elements[i] = rebaseValue(leftArr.elements[i], rightArr.elements[i])
        if (rightArr.elements[i] !== leftArr.elements[i]) {
          numRebased++
        }
      }

      return numRebased === 0 ? left : right
    }
    case 'null':
    case 'boolean':
    case 'number': {
      if (unwrap(left) === unwrap(right)) return left
      break
    }
    case 'string': {
      let leftRaw = unwrap(left) as string
      let rightRaw = unwrap(right) as string
      if (leftRaw === rightRaw) return left

      let result = rightModel.copyString(null)
      let prefix = commonPrefix(leftRaw, rightRaw)
      let suffix = commonSuffix(leftRaw, rightRaw, prefix)

      let rightLen = utf8stringSize(rightRaw)
      let leftLen = utf8stringSize(leftRaw)

      if (0 < prefix) {
        rightModel.stringAppendSlice(result, left, 0, prefix)
      }
      if (prefix < rightLen - suffix) {
        rightModel.stringAppendSlice(result, right, prefix, rightLen - suffix)
      }
      if (leftLen - suffix < leftLen) {
        rightModel.stringAppendSlice(result, left, leftLen - suffix, leftLen)
      }
      let value = rightModel.finalize(result)
      if (unwrap(value) !== rightRaw) throw new Error('incorrect string rebase')
      return value
    }
  }

  return right
}

export function applyPatch<T>(left: Value<T>, patch: RawPatch, startMeta: T) {
  let model = new Model(startMeta)
  let patcher = new Patcher(model, left, patch)
  return patcher.process()
}
