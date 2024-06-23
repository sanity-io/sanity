import {isIndexSegment, isKeySegment, isReferenceSchemaType} from '@sanity/types'
import {isString, type ObjectField, type ObjectFieldType, type Path, type SchemaType} from 'sanity'

import {type CopyActionResult} from './types'

const SANITY_CLIPBOARD_ITEM_TYPE = isWebKit()
  ? 'text/plain'
  : 'web application/sanity-studio-clipboard-item'

export const getClipboardItem = async (): Promise<CopyActionResult | null> => {
  const items = await window.navigator.clipboard.read()
  const item = items.find((i) => i.types.includes(SANITY_CLIPBOARD_ITEM_TYPE))
  const sanityItem = await item?.getType(SANITY_CLIPBOARD_ITEM_TYPE)
  if (sanityItem) {
    const text = await sanityItem.text()
    return parseCopyResult(text) || null
  }
  return null
}

export const writeClipboardItem = async (copyActionResult: CopyActionResult): Promise<boolean> => {
  try {
    const clipboardItem: Record<string, Blob> = {
      [SANITY_CLIPBOARD_ITEM_TYPE]: new Blob([JSON.stringify(copyActionResult)], {
        type: SANITY_CLIPBOARD_ITEM_TYPE,
      }),
    }
    if (SANITY_CLIPBOARD_ITEM_TYPE !== 'text/plain') {
      const text = copyActionResult.items
        .map((item) => transformValueToText(item.value))
        .filter(Boolean)
        .join('\n')
      if (text.length > 0) {
        clipboardItem['text/plain'] = new Blob([text], {type: 'text/plain'})
      }
    }
    await window.navigator.clipboard.write([new ClipboardItem(clipboardItem)])
    return true
  } catch (error) {
    console.error('Failed to write to clipboard', error)
    return false
  }
}

export function transformValueToText(value: unknown): string | number {
  if (!value) {
    return ''
  }
  if (isString(value)) {
    return value
  }

  if (Number.isFinite(value)) {
    return value.toString()
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => transformValueToText(item))
      .filter(Boolean)
      .join(', ')
  }

  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>
    return Object.keys(objectValue)
      .map((key) =>
        key.startsWith('_')
          ? ''
          : transformValueToText(typeof value === 'object' ? objectValue[key] : ''),
      )
      .filter(Boolean)
      .join(', ')
  }
  return ''
}

export function parseCopyResult(value: string): CopyActionResult | null {
  try {
    return JSON.parse(value)
  } catch (_) {
    return null
  }
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
  // Test that an object is empty. An object is considered not empty if it has some
  // key that is not prefixed with _ or has a _ref key (exception for all other _ keys)
  if (
    typeof value === 'object' &&
    Object.keys(value).filter((key) => key === '_ref' || !key.startsWith('_')).length === 0
  )
    return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

export function isNativeEditableElement(el: EventTarget): boolean {
  if (el instanceof HTMLElement && el.isContentEditable) return true
  if (el instanceof HTMLInputElement) {
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#input_types
    if (/|text|email|number|password|search|tel|url/.test(el.type || '')) {
      return !(el.disabled || el.readOnly)
    }
  }
  if (el instanceof HTMLTextAreaElement) return !(el.disabled || el.readOnly)
  return false
}

function isWebKit(): boolean {
  return 'WebkitAppearance' in document.documentElement.style
}
