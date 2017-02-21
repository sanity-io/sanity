import {get, pick, debounce, flatten, uniqBy} from 'lodash'

const pass = v => v
const PRESERVE_KEYS = ['_id', '_type']

let COLLECTED_ERRORS = {}

const reportErrors = debounce(() => {
  /* eslint-disable no-console */
  const uniqueErrors = flatten(Object.keys(COLLECTED_ERRORS).map(typeName => {
    const entries = COLLECTED_ERRORS[typeName]
    return uniqBy(entries, entry => entry.error.message)
  }))
  const errorCount = uniqueErrors.length
  console.groupCollapsed(
    `%cHeads up! Got ${errorCount === 1 ? 'error' : `${errorCount} errors`} while preparing data for preview. Click for details`,
    'color: #ff7e7c'
  )

  Object.keys(COLLECTED_ERRORS).forEach(typeName => {
    const entries = COLLECTED_ERRORS[typeName]
    const first = entries[0]
    console.group(`%o for type "${typeName}" (x${entries.length})`, first.type.preview.prepare)
    uniqBy(entries, entry => entry.error.message).forEach(entry => {
      const {value, error} = entry
      console.log('The call to prepare(%o) failed with:', value)
      console.error(error)
    })
    console.groupEnd()
  })
  console.groupEnd()
  COLLECTED_ERRORS = {}
  /* eslint-enable no-console */
}, 1000)

function invokePrepareChecked(type, value) {
  const prepare = type.preview.prepare
  if (!prepare) {
    return value
  }
  try {
    return prepare(value)
  } catch (error) {
    if (!COLLECTED_ERRORS[type.name]) {
      COLLECTED_ERRORS[type.name] = []
    }
    COLLECTED_ERRORS[type.name].push({error: error, type, value})
    reportErrors()
  }
  return value
}

function invokePrepareUnchecked(type, value) {
  return (type.preview.prepare || pass)(value)
}

const invokePrepare = __DEV__ ? invokePrepareChecked : invokePrepareUnchecked

export default function prepareForPreview(rawValue, type) {
  const selection = type.preview.select
  const targetKeys = Object.keys(selection)

  const remapped = targetKeys.reduce((acc, key) => {
    acc[key] = get(rawValue, selection[key])
    return acc
  }, pick(rawValue, PRESERVE_KEYS))

  return invokePrepare(type, remapped)
}
