import {createContext, use, useCallback} from 'react'

/**
 * The id of the hidden query tab around a component, `null` in the shown tab and outside the tabs
 * (the sidebar, the dialogs). Every tab stays mounted, the others hidden in an `<Activity>`
 * boundary, so their elements stay in the document.
 */
export const HiddenQueryTabContext = createContext<string | null>(null)

export function useQueryTabShown(): boolean {
  return use(HiddenQueryTabContext) === null
}

/**
 * Turns an element id into the one to render: the id itself in the shown tab, and one made unique
 * with the tab's id in a hidden tab. Each tab renders the same elements, and a hidden tab's would
 * otherwise be the ones `getElementById`, a `<label for>` or an `aria-controls` finds.
 */
export function useTabElementId(): (id: string) => string {
  const hiddenTabId = use(HiddenQueryTabContext)
  return useCallback(
    (id: string) => (hiddenTabId === null ? id : `${id}-hidden-${hiddenTabId}`),
    [hiddenTabId],
  )
}
