import type {Block, Span} from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && (typeof value == 'object' || typeof value == 'function')
}

export function isBlock(value: unknown): value is Block {
  return (
    isRecord(value) &&
    typeof value._type === 'string' && // block types can be named, so expect anything here.
    typeof value.style === 'string' &&
    Array.isArray(value.children) &&
    Array.isArray(value.markDefs)
  )
}

export function isSpan(value: unknown): value is Span {
  return (
    isRecord(value) &&
    value._type === 'span' &&
    typeof value.text === 'string' &&
    Array.isArray(value.marks)
  )
}
