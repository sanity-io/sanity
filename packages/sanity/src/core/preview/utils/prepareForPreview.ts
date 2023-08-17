import {
  isTitledListValue,
  PrepareViewOptions,
  PreviewValue,
  SchemaType,
  TitledListValue,
} from '@sanity/types'
import {debounce, flatten, get, isPlainObject, pick, uniqBy} from 'lodash'
import {INVALID_PREVIEW_FALLBACK} from '../constants'
import {PreviewableType} from '../types'
import {isRecord} from '../../util'
import {extractTextFromBlocks, isPortableTextPreviewValue} from './portableText'
import {keysOf} from './keysOf'

const PRESERVE_KEYS = ['_id', '_type', '_upload', '_createdAt', '_updatedAt']
const EMPTY: never[] = []

type SelectedValue = Record<string, unknown>

export type PrepareInvocationResult = {
  selectedValue?: SelectedValue
  returnValue: null | PreviewValue
  errors: Error[]
}

const errorCollector = (() => {
  let errorsByType: Record<string, {error: Error; type: SchemaType; value: SelectedValue}[]> = {}

  return {
    add: (type: SchemaType, value: SelectedValue, error: Error) => {
      if (!errorsByType[type.name]) {
        errorsByType[type.name] = []
      }
      errorsByType[type.name].push({error: error, type: type, value})
    },
    getAll() {
      return errorsByType
    },
    clear() {
      errorsByType = {}
    },
  }
})()

const reportErrors = debounce(() => {
  /* eslint-disable no-console */
  const errorsByType = errorCollector.getAll()
  const uniqueErrors = flatten(
    Object.keys(errorsByType).map((typeName) => {
      const entries = errorsByType[typeName]
      return uniqBy(entries, (entry) => entry.error.message)
    }),
  )
  const errorCount = uniqueErrors.length
  if (errorCount === 0) {
    return
  }

  console.groupCollapsed(
    `%cHeads up! Got ${
      errorCount === 1 ? 'error' : `${errorCount} errors`
    } while preparing data for preview. Click for details.`,
    'color: #ff7e7c',
  )

  Object.keys(errorsByType).forEach((typeName) => {
    const entries = errorsByType[typeName]
    const first = entries[0]
    console.group(`Check the preview config for schema type "${typeName}": %o`, first.type.preview)
    const uniqued = uniqBy(entries, (entry) => entry.error.message)
    uniqued.forEach((entry) => {
      if ((entry.error as any).type === 'returnValueError') {
        const hasPrepare = typeof entry.type.preview?.prepare === 'function'
        const {value, error} = entry
        console.log(
          `Encountered an invalid ${
            hasPrepare
              ? 'return value when calling prepare(%o)'
              : 'value targeted by preview.select'
          }:`,
          value,
        )
        console.error(error)
      }
      if ((entry.error as any).type === 'prepareError') {
        const {value, error} = entry
        console.log('Encountered an error when calling prepare(%o):', value)
        console.error(error)
      }
    })
    console.groupEnd()
  })
  console.groupEnd()
  errorCollector.clear()
  /* eslint-enable no-console */
}, 1000)

const isRenderable =
  (fieldName: string) =>
  (value: unknown): Error[] => {
    const type = typeof value
    if (
      value === null ||
      type === 'undefined' ||
      type === 'string' ||
      type === 'number' ||
      type === 'boolean'
    ) {
      return EMPTY
    }
    return [
      assignType(
        'returnValueError',
        new Error(
          `The "${fieldName}" field should be a string, number, boolean, undefined or null, instead saw ${inspect(
            value,
          )}`,
        ),
      ),
    ]
  }
const FIELD_NAME_VALIDATORS: Record<string, (value: unknown) => Error[]> = {
  media: () => {
    // not sure how to validate media as it would  possibly involve executing a function and check the
    // return value
    return EMPTY
  },
  title: isRenderable('title'),
  subtitle: isRenderable('subtitle'),
  description: isRenderable('description'),
  imageUrl: isRenderable('imageUrl'),
  date: isRenderable('date'),
}

function inspect(val: unknown, prefixType = true): string {
  if (isRecord(val)) {
    const keys = Object.keys(val)
    const ellipse = keys.length > 3 ? '...' : ''
    const prefix = `object with keys `
    return `${prefixType ? prefix : ''}{${keys.slice(0, 3).join(', ')}${ellipse}}`
  }
  if (Array.isArray(val)) {
    const ellipse = val.length > 3 ? '...' : ''
    const prefix = `array with `
    return `${prefixType ? prefix : ''}[${val.map((v) => inspect(v, false))}${ellipse}]`
  }
  return `the ${typeof val} ${val}`
}

function validateFieldValue(fieldName: string, fieldValue: unknown) {
  if (typeof fieldValue === 'undefined') {
    return EMPTY
  }
  const validator = FIELD_NAME_VALIDATORS[fieldName]
  return (validator && validator(fieldValue)) || EMPTY
}

function assignType(type: string, error: Error) {
  return Object.assign(error, {type})
}

function validatePreparedValue(preparedValue: PreviewValue | null) {
  if (!isPlainObject(preparedValue) || preparedValue === null) {
    return [
      assignType(
        'returnValueError',
        new Error(
          `Invalid return value. Expected a plain object with at least a 'title' field, instead saw ${inspect(
            preparedValue,
          )}`,
        ),
      ),
    ]
  }

  return Object.entries(preparedValue).reduce<Error[]>((acc, [fieldName, fieldValue]) => {
    return [...acc, ...validateFieldValue(fieldName, fieldValue)]
  }, EMPTY)
}

function validateReturnedPreview(result: PrepareInvocationResult) {
  return {
    ...result,
    errors: [...(result.errors || []), ...validatePreparedValue(result.returnValue)],
  }
}

function defaultPrepare(value: SelectedValue) {
  return keysOf(value).reduce((acc: SelectedValue, fieldName: keyof SelectedValue) => {
    const val = value[fieldName]
    return {
      ...acc,
      [fieldName]: isPortableTextPreviewValue(val) ? extractTextFromBlocks(val) : val,
    }
  }, {})
}

export function invokePrepare(
  type: PreviewableType,
  value: SelectedValue,
  viewOptions: PrepareViewOptions = {},
): PrepareInvocationResult {
  const prepare = type.preview?.prepare
  try {
    return {
      returnValue: prepare
        ? (prepare(value, viewOptions) as Record<string, unknown>)
        : defaultPrepare(value),
      errors: EMPTY,
    }
  } catch (error) {
    return {
      returnValue: null,
      errors: [assignType('prepareError', error)],
    }
  }
}

function withErrors(
  result: {errors: Error[]},
  type: SchemaType,
  selectedValue: SelectedValue,
): PreviewValue {
  result.errors.forEach((error) => errorCollector.add(type, selectedValue, error))
  reportErrors()

  return INVALID_PREVIEW_FALLBACK
}

interface EnumListOptions {
  list: TitledListValue[] | unknown[]
}

function hasEnumListOptions(
  type: SchemaType,
): type is SchemaType & {options: SchemaType['options'] & EnumListOptions} {
  const options = type.options && typeof type.options === 'object' ? type.options : false
  if (!options || !('list' in options)) {
    return false
  }

  const listOptions = (options as EnumListOptions).list
  return Array.isArray(listOptions)
}

function getListOptions(type: SchemaType): TitledListValue[] | undefined {
  if (!hasEnumListOptions(type)) {
    return undefined
  }

  const listOptions = type.options.list as EnumListOptions['list']
  return listOptions.map((option) =>
    isTitledListValue(option) ? option : ({title: option, value: option} as TitledListValue),
  )
}

/** @internal */
export function prepareForPreview(
  rawValue: unknown,
  type: SchemaType,
  viewOptions: PrepareViewOptions = {},
): PreviewValue & {_createdAt?: string; _updatedAt?: string} {
  const hasCustomPrepare = typeof type.preview?.prepare === 'function'
  const selection: Record<string, string> = type.preview?.select || {}
  const targetKeys = Object.keys(selection)

  const selectedValue = targetKeys.reduce<Record<string, unknown>>((acc, key) => {
    // Find the field the value belongs to
    const typeWithFields = 'fields' in type ? type : null
    const targetFieldName = selection[key]
    const valueField = typeWithFields?.fields?.find((f) => f.name === targetFieldName)
    const listOptions = valueField && getListOptions(valueField.type)

    // If the user has _not_ specified a `prepare()` function for the preview, and the
    // field type has an `options.list`, we want to use the title of the selected item
    // as the preview value. If, however, there _is_ a custom `prepare()`, we leave this
    // mapping up to the user to perform should they want to. This is both to maintain
    // backwards compatiblity, but also to allow using the raw value for prepare operations
    if (!hasCustomPrepare && listOptions) {
      // Find the selected option that matches the raw value
      const selectedOption =
        listOptions && listOptions.find((opt) => opt.value === get(rawValue, selection[key]))
      acc[key] = selectedOption ? selectedOption.value : get(rawValue, selection[key])
    } else {
      acc[key] = get(rawValue, selection[key])
    }

    return acc
  }, {})

  const prepareResult = invokePrepare(type, selectedValue, viewOptions)
  if (prepareResult.errors.length > 0) {
    return withErrors(prepareResult, type, selectedValue)
  }

  const returnValueResult = validateReturnedPreview(invokePrepare(type, selectedValue, viewOptions))
  return returnValueResult.errors.length > 0
    ? withErrors(returnValueResult, type, selectedValue)
    : {...pick(rawValue, PRESERVE_KEYS), ...prepareResult.returnValue}
}
