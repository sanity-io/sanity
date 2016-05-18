import {clone} from 'lodash'

// Based on react-addons-update

function keyOf(oneKeyObj) {
  for (const key in oneKeyObj) {
    if (!oneKeyObj.hasOwnProperty(key)) {
      continue
    }
    return key
  }
  return null
}

function invariant(condition, format, ...args) {
  if (!condition) {
    let argIndex = 0
    const error = new Error(format.replace(/%s/g, () => args[argIndex++]))
    error.name = 'Invariant Violation'
    throw error
  }
}

const hasOwnProperty = {}.hasOwnProperty

const shallowCopy = clone

const COMMAND_PUSH = keyOf({$push: null})
const COMMAND_UNSHIFT = keyOf({$unshift: null})
const COMMAND_SPLICE = keyOf({$splice: null})
const COMMAND_SET = keyOf({$set: null})
const COMMAND_MERGE = keyOf({$merge: null})
const COMMAND_APPLY = keyOf({$apply: null})

const ALL_COMMANDS_LIST = [
  COMMAND_PUSH,
  COMMAND_UNSHIFT,
  COMMAND_SPLICE,
  COMMAND_SET,
  COMMAND_MERGE,
  COMMAND_APPLY
]

const ALL_COMMANDS_SET = {}

ALL_COMMANDS_LIST.forEach(command => {
  ALL_COMMANDS_SET[command] = true
})

function invariantArrayCase(value, spec, command) {
  invariant(
    Array.isArray(value),
    'applyPatch(): expected target of %s to be an array got %s.',
    command,
    value
  )
  const specValue = spec[command]
  invariant(
    Array.isArray(specValue),
    'applyPatch(): expected spec of %s to be an array got %s. '
    + 'Did you forget to wrap your parameter in an array?',
    command,
    specValue
  )
}

/**
 * Returns a updated shallow copy of an object without mutating the original.
 * See https://facebook.github.io/react/docs/update.html for details.
 */
export default function applyPatch(value, patch) {
  invariant(
    typeof patch === 'object',
    'applyPatch(): You provided a key path to applyPatch() that did not contain one '
    + 'of %s. Did you forget to include {%s: ...}?',
    ALL_COMMANDS_LIST.join(', '),
    COMMAND_SET
  )

  if (hasOwnProperty.call(patch, COMMAND_SET)) {
    invariant(
      Object.keys(patch).length === 1,
      'Cannot have more than one key in an object with %s',
      COMMAND_SET
    )

    return patch[COMMAND_SET]
  }

  const nextValue = shallowCopy(value)

  if (hasOwnProperty.call(patch, COMMAND_MERGE)) {
    const mergeObj = patch[COMMAND_MERGE]
    invariant(
      mergeObj && typeof mergeObj === 'object',
      'applyPatch(): %s expects a patch of type \'object\' got %s',
      COMMAND_MERGE,
      mergeObj
    )
    invariant(
      nextValue && typeof nextValue === 'object',
      'applyPatch(): %s expects a target of type \'object\' got %s',
      COMMAND_MERGE,
      nextValue
    )
    Object.assign(nextValue, patch[COMMAND_MERGE])
  }

  if (hasOwnProperty.call(patch, COMMAND_PUSH)) {
    invariantArrayCase(value, patch, COMMAND_PUSH)
    patch[COMMAND_PUSH].forEach(item => {
      nextValue.push(item)
    })
  }

  if (hasOwnProperty.call(patch, COMMAND_UNSHIFT)) {
    invariantArrayCase(value, patch, COMMAND_UNSHIFT)
    patch[COMMAND_UNSHIFT].forEach(item => {
      nextValue.unshift(item)
    })
  }

  if (hasOwnProperty.call(patch, COMMAND_SPLICE)) {
    invariant(
      Array.isArray(value),
      'Expected %s target to be an array got %s',
      COMMAND_SPLICE,
      value
    )
    invariant(
      Array.isArray(patch[COMMAND_SPLICE]),
      'applyPatch(): expected patch of %s to be an array of arrays got %s. '
      + 'Did you forget to wrap your parameters in an array?',
      COMMAND_SPLICE,
      patch[COMMAND_SPLICE]
    )
    patch[COMMAND_SPLICE].forEach(args => {
      invariant(
        Array.isArray(args),
        'applyPatch(): expected patch of %s to be an array of arrays got %s. '
        + 'Did you forget to wrap your parameters in an array?',
        COMMAND_SPLICE,
        patch[COMMAND_SPLICE]
      )
      nextValue.splice(...args)
    })
  }

  for (const key in patch) {
    if (!(ALL_COMMANDS_SET.hasOwnProperty(key) && ALL_COMMANDS_SET[key])) {
      nextValue[key] = applyPatch(value[key], patch[key])
    }
  }

  return nextValue
}
