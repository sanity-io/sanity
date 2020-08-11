import {ObjectModel} from './object-model'
import {RawPatch} from './patch'

const OPS = [
  'Value',
  'Copy',
  'Blank',
  'ReturnIntoArray',
  'ReturnIntoObject',
  'ReturnIntoObjectSameKey',
  'PushField',
  'PushElement',
  'PushParent',
  'Pop',
  'PushFieldCopy',
  'PushFieldBlank',
  'PushElementCopy',
  'PushElementBlank',
  'ReturnIntoObjectPop',
  'ReturnIntoObjectSameKeyPop',
  'ReturnIntoArrayPop',
  'ObjectSetFieldValue',
  'ObjectCopyField',
  'ObjectDeleteField',
  'ArrayAppendValue',
  'ArrayAppendSlice',
  'StringAppendString',
  'StringAppendSlice'
]

type InputEntry<V> = {
  value: V
  key?: string
  keys?: string[]
}

type OutputEntry<V, S, O, A> = {
  value: V | null
  writeValue?: S | O | A
}

export class Patcher<V, S, O, A> {
  private model: ObjectModel<V, S, O, A>
  private root: V
  private patch: RawPatch
  private i = 0
  private inputStack: InputEntry<V>[] = []
  private outputStack: OutputEntry<V, S, O, A>[] = []

  constructor(model: ObjectModel<V, S, O, A>, root: V, patch: RawPatch) {
    this.model = model
    this.root = root
    this.patch = patch
  }

  read(): unknown {
    return this.patch[this.i++]
  }

  process() {
    this.inputStack.push({value: this.root})
    this.outputStack.push({value: this.root})

    for (; this.i < this.patch.length; ) {
      let opcode = this.read() as number
      let op = OPS[opcode]
      if (!op) throw new Error(`Unknown opcode: ${opcode}`)
      let processor = `process${op}`
      ;(this as any)[processor].apply(this)
    }

    let entry = this.outputStack.pop()!
    return this.finalizeOutput(entry)
  }

  inputEntry(): InputEntry<V> {
    return this.inputStack[this.inputStack.length - 1]
  }

  inputKey(entry: InputEntry<V>, idx: number): string {
    if (!entry.keys) {
      entry.keys = this.model.objectGetKeys(entry.value).sort()
    }

    return entry.keys[idx]
  }

  outputEntry(): OutputEntry<V, S, O, A> {
    return this.outputStack[this.outputStack.length - 1]
  }

  outputArray(): A {
    let entry = this.outputEntry()

    if (!entry.writeValue) {
      entry.writeValue = this.model.copyArray(entry.value)
    }

    return entry.writeValue as A
  }

  outputObject(): O {
    let entry = this.outputEntry()

    if (!entry.writeValue) {
      entry.writeValue = this.model.copyObject(entry.value)
    }

    return entry.writeValue as O
  }

  outputString(): S {
    let entry = this.outputEntry()

    if (!entry.writeValue) {
      entry.writeValue = this.model.copyString(entry.value)
    }

    return entry.writeValue as S
  }

  finalizeOutput(entry: OutputEntry<V, S, O, A>): V {
    if (entry.writeValue) {
      return this.model.finalize(entry.writeValue)
    } else {
      return entry.value!
    }
  }

  // Processors:

  processValue() {
    let value = this.model.wrap(this.read())
    this.outputStack.push({value})
  }

  processCopy() {
    let input = this.inputEntry()
    this.outputStack.push({value: input.value})
  }

  processBlank() {
    this.outputStack.push({value: null})
  }

  processReturnIntoArray() {
    let entry = this.outputStack.pop()!
    let result = this.finalizeOutput(entry)
    let arr = this.outputArray()
    this.model.arrayAppendValue(arr, result)
  }

  processReturnIntoObject() {
    let key = this.read() as string
    let entry = this.outputStack.pop()!
    let result = this.finalizeOutput(entry)
    result = this.model.markChanged(result)
    let obj = this.outputObject()
    this.model.objectSetField(obj, key, result)
  }

  processReturnIntoObjectSameKey() {
    let input = this.inputEntry()
    let entry = this.outputStack.pop()!
    let result = this.finalizeOutput(entry)
    let obj = this.outputObject()
    this.model.objectSetField(obj, input.key!, result)
  }

  processPushField() {
    let idx = this.read() as number
    let entry = this.inputEntry()
    let key = this.inputKey(entry, idx)
    let value = this.model.objectGetField(entry.value, key)
    this.inputStack.push({value, key})
  }

  processPushElement() {
    let idx = this.read() as number
    let entry = this.inputEntry()
    let value = this.model.arrayGetElement(entry.value, idx)
    this.inputStack.push({value})
  }

  processPop() {
    this.inputStack.pop()
  }

  processPushFieldCopy() {
    this.processPushField()
    this.processCopy()
  }

  processPushFieldBlank() {
    this.processPushField()
    this.processBlank()
  }

  processPushElementCopy() {
    this.processPushElement()
    this.processCopy()
  }

  processPushElementBlank() {
    this.processPushElement()
    this.processBlank()
  }

  processReturnIntoObjectPop() {
    this.processReturnIntoObject()
    this.processPop()
  }

  processReturnIntoObjectSameKeyPop() {
    this.processReturnIntoObjectSameKey()
    this.processPop()
  }

  processReturnIntoArrayPop() {
    this.processReturnIntoArray()
    this.processPop()
  }

  processObjectSetFieldValue() {
    this.processValue()
    this.processReturnIntoObject()
  }

  processObjectCopyField() {
    this.processPushField()
    this.processCopy()
    this.processReturnIntoObjectSameKey()
    this.processPop()
  }

  processObjectDeleteField() {
    let idx = this.read() as number
    let entry = this.inputEntry()
    let key = this.inputKey(entry, idx)
    let obj = this.outputObject()
    this.model.objectDeleteField(obj, key)
  }

  processArrayAppendValue() {
    let value = this.model.wrap(this.read())
    let arr = this.outputArray()
    this.model.arrayAppendValue(arr, value)
  }

  processArrayAppendSlice() {
    let left = this.read() as number
    let right = this.read() as number
    let str = this.outputArray()
    let val = this.inputEntry().value
    this.model.arrayAppendSlice(str, val, left, right)
  }

  processStringAppendString() {
    let value = this.model.wrap(this.read())
    let str = this.outputString()
    this.model.stringAppendValue(str, value)
  }

  processStringAppendSlice() {
    let left = this.read() as number
    let right = this.read() as number
    let str = this.outputString()
    let val = this.inputEntry().value
    this.model.stringAppendSlice(str, val, left, right)
  }
}
