'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.Patcher = void 0

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    })
  } else {
    obj[key] = value
  }
  return obj
}

var OPS = [
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
  'StringAppendSlice',
]

class Patcher {
  constructor(model, root, patch) {
    _defineProperty(this, 'model', void 0)

    _defineProperty(this, 'root', void 0)

    _defineProperty(this, 'patch', void 0)

    _defineProperty(this, 'i', 0)

    _defineProperty(this, 'inputStack', [])

    _defineProperty(this, 'outputStack', [])

    this.model = model
    this.root = root
    this.patch = patch
  }

  read() {
    return this.patch[this.i++]
  }

  process() {
    this.inputStack.push({
      value: this.root,
    })
    this.outputStack.push({
      value: this.root,
    })

    for (; this.i < this.patch.length; ) {
      var opcode = this.read()
      var op = OPS[opcode]
      if (!op) throw new Error('Unknown opcode: '.concat(opcode))
      var processor = 'process'.concat(op)
      this[processor].apply(this)
    }

    var entry = this.outputStack.pop()
    return this.finalizeOutput(entry)
  }

  inputEntry() {
    return this.inputStack[this.inputStack.length - 1]
  }

  inputKey(entry, idx) {
    if (!entry.keys) {
      entry.keys = this.model.objectGetKeys(entry.value).sort()
    }

    return entry.keys[idx]
  }

  outputEntry() {
    return this.outputStack[this.outputStack.length - 1]
  }

  outputArray() {
    var entry = this.outputEntry()

    if (!entry.writeValue) {
      entry.writeValue = this.model.copyArray(entry.value)
    }

    return entry.writeValue
  }

  outputObject() {
    var entry = this.outputEntry()

    if (!entry.writeValue) {
      entry.writeValue = this.model.copyObject(entry.value)
    }

    return entry.writeValue
  }

  outputString() {
    var entry = this.outputEntry()

    if (!entry.writeValue) {
      entry.writeValue = this.model.copyString(entry.value)
    }

    return entry.writeValue
  }

  finalizeOutput(entry) {
    if (entry.writeValue) {
      return this.model.finalize(entry.writeValue)
    } else {
      return entry.value
    }
  } // Processors:

  processValue() {
    var value = this.model.wrap(this.read())
    this.outputStack.push({
      value,
    })
  }

  processCopy() {
    var input = this.inputEntry()
    this.outputStack.push({
      value: input.value,
    })
  }

  processBlank() {
    this.outputStack.push({
      value: null,
    })
  }

  processReturnIntoArray() {
    var entry = this.outputStack.pop()
    var result = this.finalizeOutput(entry)
    var arr = this.outputArray()
    this.model.arrayAppendValue(arr, result)
  }

  processReturnIntoObject() {
    var key = this.read()
    var entry = this.outputStack.pop()
    var result = this.finalizeOutput(entry)
    result = this.model.markChanged(result)
    var obj = this.outputObject()
    this.model.objectSetField(obj, key, result)
  }

  processReturnIntoObjectSameKey() {
    var input = this.inputEntry()
    var entry = this.outputStack.pop()
    var result = this.finalizeOutput(entry)
    var obj = this.outputObject()
    this.model.objectSetField(obj, input.key, result)
  }

  processPushField() {
    var idx = this.read()
    var entry = this.inputEntry()
    var key = this.inputKey(entry, idx)
    var value = this.model.objectGetField(entry.value, key)
    this.inputStack.push({
      value,
      key,
    })
  }

  processPushElement() {
    var idx = this.read()
    var entry = this.inputEntry()
    var value = this.model.arrayGetElement(entry.value, idx)
    this.inputStack.push({
      value,
    })
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
    var idx = this.read()
    var entry = this.inputEntry()
    var key = this.inputKey(entry, idx)
    var obj = this.outputObject()
    this.model.objectDeleteField(obj, key)
  }

  processArrayAppendValue() {
    var value = this.model.wrap(this.read())
    var arr = this.outputArray()
    this.model.arrayAppendValue(arr, value)
  }

  processArrayAppendSlice() {
    var left = this.read()
    var right = this.read()
    var str = this.outputArray()
    var val = this.inputEntry().value
    this.model.arrayAppendSlice(str, val, left, right)
  }

  processStringAppendString() {
    var value = this.model.wrap(this.read())
    var str = this.outputString()
    this.model.stringAppendValue(str, value)
  }

  processStringAppendSlice() {
    var left = this.read()
    var right = this.read()
    var str = this.outputString()
    var val = this.inputEntry().value
    this.model.stringAppendSlice(str, val, left, right)
  }
}

exports.Patcher = Patcher
