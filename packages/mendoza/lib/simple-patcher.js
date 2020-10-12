'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.applyPatch = applyPatch

var _internalPatcher = require('./internal-patcher')

var _utf = require('./utf8')

function _slicedToArray(arr, i) {
  return (
    _arrayWithHoles(arr) ||
    _iterableToArrayLimit(arr, i) ||
    _unsupportedIterableToArray(arr, i) ||
    _nonIterableRest()
  )
}

function _nonIterableRest() {
  throw new TypeError(
    'Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
  )
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return
  if (typeof o === 'string') return _arrayLikeToArray(o, minLen)
  var n = Object.prototype.toString.call(o).slice(8, -1)
  if (n === 'Object' && o.constructor) n = o.constructor.name
  if (n === 'Map' || n === 'Set') return Array.from(o)
  if (n === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray(o, minLen)
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i]
  }
  return arr2
}

function _iterableToArrayLimit(arr, i) {
  if (typeof Symbol === 'undefined' || !(Symbol.iterator in Object(arr))) return
  var _arr = []
  var _n = true
  var _d = false
  var _e = undefined
  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value)
      if (i && _arr.length === i) break
    }
  } catch (err) {
    _d = true
    _e = err
  } finally {
    try {
      if (!_n && _i['return'] != null) _i['return']()
    } finally {
      if (_d) throw _e
    }
  }
  return _arr
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr
}

var Model = {
  wrap(data) {
    return data
  },

  finalize(b) {
    if (Array.isArray(b)) {
      return b
    } else {
      return b.data
    }
  },

  markChanged(value) {
    return value
  },

  objectGetKeys(value) {
    return Object.keys(value)
  },

  objectGetField(value, key) {
    return value[key]
  },

  arrayGetElement(value, idx) {
    return value[idx]
  },

  copyObject(value) {
    var res = {
      type: 'object',
      data: {},
    }

    if (value !== null) {
      for (var _i = 0, _Object$entries = Object.entries(value); _i < _Object$entries.length; _i++) {
        var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
          _key = _Object$entries$_i[0],
          val = _Object$entries$_i[1]

        res.data[_key] = val
      }
    }

    return res
  },

  copyArray(value) {
    if (value === null) return []
    return value.slice()
  },

  copyString(value) {
    return {
      type: 'string',
      data: value === null ? '' : value,
    }
  },

  objectSetField(target, key, value) {
    target.data[key] = value
  },

  objectDeleteField(target, key) {
    delete target.data[key]
  },

  arrayAppendValue(target, value) {
    target.push(value)
  },

  arrayAppendSlice(target, source, left, right) {
    target.push(...source.slice(left, right))
  },

  stringAppendSlice(target, source, left, right) {
    var sourceString = source
    var leftPos = (0, _utf.utf8resolveIndex)(sourceString, left)
    var rightPos = (0, _utf.utf8resolveIndex)(sourceString, right, leftPos)
    target.data += sourceString.slice(leftPos, rightPos)
  },

  stringAppendValue(target, value) {
    target.data += value
  },
} // Applies a patch on a JavaScript object.

function applyPatch(left, patch) {
  var root = left // No need to wrap because the representation is the same.

  var patcher = new _internalPatcher.Patcher(Model, root, patch)
  return patcher.process()
}
