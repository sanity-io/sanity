'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.utf8charSize = utf8charSize
exports.utf8stringSize = utf8stringSize
exports.utf8resolveIndex = utf8resolveIndex
exports.commonPrefix = commonPrefix
exports.commonSuffix = commonSuffix

function utf8charSize(code) {
  if (code >> 16) {
    return 4
  } else if (code >> 11) {
    return 3
  } else if (code >> 7) {
    return 2
  } else {
    return 1
  }
}

function utf8stringSize(str) {
  var b = 0

  for (var i = 0; i < str.length; i++) {
    var code = str.codePointAt(i)
    var size = utf8charSize(code)
    if (size == 4) i++
    b += size
  }

  return b
}
/** Converts an UTF-8 byte index into a UCS-2 index. */

function utf8resolveIndex(str, idx) {
  var start = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0
  var byteCount = start
  var ucsIdx = 0

  for (ucsIdx = start; byteCount < idx; ucsIdx++) {
    var code = str.codePointAt(ucsIdx)
    var size = utf8charSize(code)
    if (size === 4) ucsIdx++ // Surrogate pair.

    byteCount += size
  }

  return ucsIdx
}

function commonPrefix(str, str2) {
  var len = Math.min(str.length, str2.length)
  var b = 0

  for (var i = 0; i < len; ) {
    var aPoint = str.codePointAt(i)
    var bPoint = str2.codePointAt(i)
    if (aPoint !== bPoint) return b
    var size = utf8charSize(aPoint)
    b += size
    i += size === 4 ? 2 : 1
  }

  return b
}

function commonSuffix(str, str2) {
  var prefix = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0
  var len = Math.min(str.length, str2.length) - prefix
  var b = 0

  for (var i = 0; i < len; ) {
    var aPoint = str.codePointAt(str.length - 1 - i)
    var bPoint = str2.codePointAt(str2.length - 1 - i)
    if (aPoint !== bPoint) return b
    var size = utf8charSize(aPoint)
    b += size
    i += size === 4 ? 2 : 1
  }

  return b
}
