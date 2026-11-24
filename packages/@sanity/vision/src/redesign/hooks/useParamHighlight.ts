import {type FocusEvent, type RefObject, useCallback, useMemo} from 'react'

import {type VisionCodeMirrorHandle} from '../../codemirror/VisionCodeMirror'
import {highlightedParamOf, setHighlightedParam} from '../util/paramHighlight'

/** Set on a Params form field, with the name of the param it edits */
const PARAM_NAME_ATTRIBUTE = 'data-vision-param'

/**
 * The param `node` is in. A field's own elements carry the attribute. An autocomplete list does
 * not: it is portaled, and the input points at that list with `aria-owns`, so an option in the
 * list still belongs to the field inside `pane`.
 */
function paramNameOf(pane: Element, node: EventTarget | null): string | null {
  if (!(node instanceof Element)) return null
  const direct = node.closest(`[${PARAM_NAME_ATTRIBUTE}]`)?.getAttribute(PARAM_NAME_ATTRIBUTE)
  if (direct) return direct
  const listId = node.closest('[role="listbox"]')?.id
  if (!listId) return null
  for (const owner of pane.querySelectorAll('[aria-owns]')) {
    const owns = owner.getAttribute('aria-owns')
    if (!owns?.split(/\s+/).includes(listId)) continue
    return owner.closest(`[${PARAM_NAME_ATTRIBUTE}]`)?.getAttribute(PARAM_NAME_ATTRIBUTE) ?? null
  }
  return null
}

/**
 * Marks the query editor's references to the param being edited in the Params pane: the form
 * field that has focus, or the JSON entry the cursor is in. The mark is a state effect on the
 * query editor, so its focus and selection stay as they were.
 */
export function useParamHighlight(queryEditorRef: RefObject<VisionCodeMirrorHandle | null>) {
  const highlightParam = useCallback(
    (name: string | null) => {
      queryEditorRef.current?.runCommand((view) => {
        if (highlightedParamOf(view.state) === name) return false
        view.dispatch({effects: setHighlightedParam.of(name)})
        return true
      })
    },
    [queryEditorRef],
  )

  const formFocusProps = useMemo(
    () => ({
      // A form that unmounts with focus in it reports no blur
      ref: () => () => highlightParam(null),
      onFocus: (event: FocusEvent<HTMLElement>) => {
        highlightParam(paramNameOf(event.currentTarget, event.target))
      },
      onBlur: (event: FocusEvent<HTMLElement>) => {
        const next = event.relatedTarget
        // The list is portaled outside this element, but focus there is still in its field
        if (next instanceof Node && event.currentTarget.contains(next)) return
        if (paramNameOf(event.currentTarget, next)) return
        highlightParam(null)
      },
    }),
    [highlightParam],
  )

  return {highlightParam, formFocusProps}
}
