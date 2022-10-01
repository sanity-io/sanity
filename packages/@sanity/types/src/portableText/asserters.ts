import type {Block, Span} from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && (typeof value == 'object' || typeof value == 'function')
}

/** @internal */
export function isBlock<T = Span>(value: unknown): value is Block<T> {
  return (
    isRecord(value) &&
    typeof value._type === 'string' && // block types can be named, so expect anything here.
    typeof value.style === 'string' &&
    Array.isArray(value.children) &&
    Array.isArray(value.markDefs)
  )
}

/** @internal */
export function isSpan(value: unknown): value is Span {
  return (
    isRecord(value) &&
    value._type === 'span' &&
    typeof value.text === 'string' &&
    Array.isArray(value.marks)
  )
}
