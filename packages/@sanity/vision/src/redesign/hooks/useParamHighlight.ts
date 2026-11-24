import {type FocusEvent, type RefObject, useCallback, useMemo} from 'react'

import {type VisionCodeMirrorHandle} from '../../codemirror/VisionCodeMirror'
import {highlightedParamOf, setHighlightedParam} from '../util/paramHighlight'

/** Set on a Params form field, with the name of the param it edits */
const PARAM_NAME_ATTRIBUTE = 'data-vision-param'

function paramNameOf(element: EventTarget): string | null {
  if (!(element instanceof Element)) return null
  return element.closest(`[${PARAM_NAME_ATTRIBUTE}]`)?.getAttribute(PARAM_NAME_ATTRIBUTE) ?? null
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
      onFocus: (event: FocusEvent<HTMLElement>) => highlightParam(paramNameOf(event.target)),
      onBlur: (event: FocusEvent<HTMLElement>) => {
        if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget)) {
          highlightParam(null)
        }
      },
    }),
    [highlightParam],
  )

  return {highlightParam, formFocusProps}
}
