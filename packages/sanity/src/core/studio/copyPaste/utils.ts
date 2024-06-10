import {isIndexSegment, isKeySegment, isReferenceSchemaType} from '@sanity/types'
import {isFinite} from 'lodash'
import {isString, type ObjectField, type ObjectFieldType, type Path, type SchemaType} from 'sanity'

import {type CopyActionResult} from './types'

export const getClipboardItem = async (): Promise<CopyActionResult | null> => {
  const value = await window.navigator.clipboard.readText().then((text) => {
    return parseCopyResult(text)
  })

  if (!isCopyPasteResult(value)) {
    return null
  }

  return value
}

export const writeClipboardItem = (value: CopyActionResult): void => {
  window.navigator.clipboard.writeText(JSON.stringify(value))
}

export function isCopyPasteResult(value: any): value is CopyActionResult {
  const normalized = typeof value === 'string' ? parseCopyResult(value) : value

  return typeof normalized === 'object' && normalized?._type === 'copyResult'
}

export function transformValueToPrimitive(
  copyActionResult: CopyActionResult | null,
): string | number {
  if (!copyActionResult) {
    return ''
  }

  const {value} = copyActionResult.items[0]

  if (isString(value)) {
    return value
  }

  if (isFinite(value)) {
    return Number(value)
  }

  if (isString(value) && isFinite(parseFloat(value))) {
    return parseFloat(value)
  }

  return value?.toString() || ''
}

export function parseCopyResult(value: any): CopyActionResult | null {
  try {
    return JSON.parse(value)
  } catch (_) {
    return null
  }
}

export function isSelectionWithinInputElement(element: HTMLElement | EventTarget | null): boolean {
  const activeElement = document.activeElement as HTMLElement

  // Check if the active element is a textarea or input
  if (
    activeElement &&
    (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')
  ) {
    const inputElement = activeElement as HTMLInputElement | HTMLTextAreaElement

    // Check if there is a text selection within the input/textarea element
    if (inputElement.selectionStart !== null && inputElement.selectionEnd !== null) {
      return inputElement.selectionStart !== inputElement.selectionEnd
    }
  }

  return false
}

export function isInputElement(
  element: any | HTMLElement | null,
): element is HTMLInputElement | HTMLTextAreaElement {
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
}

export function insertTextAtCursor(element: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const start = element.selectionStart || 0
  const end = element.selectionEnd || 0
  const value = element.value

  // React will override the native input value setter
  const nativeInputValueSetter = getNativeInputValueSetter()

  nativeInputValueSetter?.call(element, value.slice(0, start) + text + value.slice(end))
  element.selectionStart = start
  element.selectionEnd = start + text.length

  const changeEvent = new Event('input', {bubbles: true})
  element.dispatchEvent(changeEvent)
}

/**
 * Get the native input value setter function
 */
function getNativeInputValueSetter() {
  if (!window || !window.HTMLInputElement || !Object) {
    return null
  }

  return Object.getOwnPropertyDescriptor(window?.HTMLInputElement?.prototype, 'value')?.set
}

export function tryResolveSchemaTypeForPath(
  baseType: SchemaType,
  pathSegments: Path,
): SchemaType | undefined {
  let current: SchemaType | undefined = baseType
  for (const segment of pathSegments) {
    if (!current) {
      return undefined
    }

    if (typeof segment === 'string') {
      current = getFieldTypeByName(current, segment)
      continue
    }

    const isArrayAccessor = isKeySegment(segment) || isIndexSegment(segment)
    if (!isArrayAccessor || current.jsonType !== 'array') {
      return undefined
    }

    const [memberType, otherType] = current.of || []
    if (otherType || !memberType) {
      // Can't figure out the type without knowing the value
      return undefined
    }

    if (!isReferenceSchemaType(memberType)) {
      current = memberType
      continue
    }

    const [refType, otherRefType] = memberType.to || []
    if (otherRefType || !refType) {
      // Can't figure out the type without knowing the value
      return undefined
    }

    current = refType
  }

  return current
}

function getFieldTypeByName(type: SchemaType, fieldName: string): SchemaType | undefined {
  if (!('fields' in type)) {
    return undefined
  }

  const fieldType = type.fields.find((field) => field.name === fieldName)
  return fieldType ? fieldType.type : undefined
}

export function fieldExtendsType(field: ObjectField | ObjectFieldType, ofType: string): boolean {
  let current: SchemaType | undefined = field.type
  while (current) {
    if (current.name === ofType) {
      return true
    }

    if (!current.type && current.jsonType === ofType) {
      return true
    }

    current = current.type
  }

  return false
}

export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (typeof value === 'number' && isNaN(value)) return true
  if (typeof value === 'object' && Object.keys(value).length === 0) return true
  if (
    typeof value === 'object' &&
    Object.keys(value).length === 1 &&
    Object.keys(value)[0] === '_type'
  )
    return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}
