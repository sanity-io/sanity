import {type ObjectSchemaType} from '@sanity/types'

import {type _WithLegacyMarkdownArgs} from '../../../types/blockProps'

type LegacyMarkdownCallbackArg = {
  context: {schema: unknown}
  props?: {level?: number}
}

const parseResponsiveWidth = (value: unknown): (number | 'auto')[] => {
  if (Array.isArray(value)) {
    return value.flatMap(parseResponsiveWidth)
  }
  if (typeof value === 'number') {
    return [value]
  }
  return value === 'auto' ? ['auto'] : [1]
}
const parseModalType = (value: unknown): 'popover' | 'dialog' | undefined => {
  return value === 'dialog' || value === 'popover' ? value : undefined
}

// Keyed on the caller's own callback so a config rebuilt from scratch on every
// render (the documented spread-and-override pattern) still yields the same
// wrapped function reference, and the plugin's identity-keyed behaviors don't
// re-register every render.
const wrappedMarkdownCallbacks = new WeakMap<object, (arg: LegacyMarkdownCallbackArg) => unknown>()

/**
 * The markdown shortcuts plugin already calls every callback except
 * `horizontalRuleObject` and `linkObject` with a top-level `schema` (and
 * `headingStyle` additionally with a top-level `level`), so merging those
 * legacy fields back into the argument here is a no-op today for the
 * callbacks that get them, and harmlessly adds a `schema` key the plugin
 * never passed for `horizontalRuleObject`/`linkObject`. It becomes the
 * compat layer once the plugin drops the deprecated top-level
 * `schema`/`level` params, keeping `boldDecorator: ({schema}) => ...`-style
 * studio configs working. Do not remove this as unused indirection before
 * that plugin bump lands.
 */
export function _withLegacyMarkdownArgs<T extends Record<string, unknown>>(
  config: _WithLegacyMarkdownArgs<T>,
): T {
  const wrapped: Record<string, unknown> = {...config}
  for (const [key, value] of Object.entries(config)) {
    if (typeof value !== 'function') {
      continue
    }
    let wrappedFn = wrappedMarkdownCallbacks.get(value)
    if (!wrappedFn) {
      wrappedFn = (arg: LegacyMarkdownCallbackArg) =>
        value({
          ...arg,
          schema: arg.context.schema,
          ...(arg.props?.level !== undefined && {level: arg.props.level}),
        })
      wrappedMarkdownCallbacks.set(value, wrappedFn)
    }
    wrapped[key] = wrappedFn
  }
  return wrapped as T
}

export function _getModalOption(
  schemaType: ObjectSchemaType,
): {type?: 'dialog' | 'popover'; width?: (number | 'auto')[]} | undefined {
  const raw = schemaType.options?.modal
  if (typeof raw !== 'object' || raw === null) {
    return undefined
  }
  const width = parseResponsiveWidth(raw.width)
  return {
    type: parseModalType(raw.type),
    // Return `undefined` (not an empty array) when no width is configured, so the
    // edit modal components fall back to their own width defaults (popover 960px /
    // dialog 640px). An empty array is "defined" and would otherwise collapse the
    // popover to content/auto width — making e.g. a reference field inside an
    // annotation render uselessly narrow.
    width: width.length > 0 ? width : undefined,
  }
}
