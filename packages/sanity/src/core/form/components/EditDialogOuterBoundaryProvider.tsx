import {useBoundaryElement} from '@sanity/ui'
import {type ReactNode, useContext, useMemo} from 'react'
import {EditDialogOuterBoundaryContext} from 'sanity/_singletons'

/**
 * @internal
 */
export interface EditDialogOuterBoundaryContextValue {
  /**
   * The boundary element that was ambient outside the outermost edit dialog, or `null` when the
   * dialog itself had no ambient boundary.
   */
  element: HTMLElement | null
}

/**
 * Captures the ambient Floating UI boundary as seen by an edit dialog / modal, before the dialog
 * shadows it with its own scroll container (`BoundaryElementProvider`). Render it *around* the
 * dialog's `BoundaryElementProvider`.
 *
 * Popovers that are allowed to overflow the dialog (currently only the array insert menu) use the
 * captured element — typically the document pane's scroll container — as their floating boundary,
 * so they can escape the dialog while still respecting the pane header and footer.
 *
 * When edit dialogs are stacked, the value captured by the outermost dialog is inherited, so
 * popovers in nested dialogs are not constrained to the (hidden) parent dialog's content box.
 *
 * @internal
 */
export function EditDialogOuterBoundaryProvider(props: {children: ReactNode}): React.JSX.Element {
  const {children} = props
  const inherited = useContext(EditDialogOuterBoundaryContext)
  const {element} = useBoundaryElement()

  const value = useMemo<EditDialogOuterBoundaryContextValue>(
    () => inherited ?? {element},
    [inherited, element],
  )

  return (
    <EditDialogOuterBoundaryContext.Provider value={value}>
      {children}
    </EditDialogOuterBoundaryContext.Provider>
  )
}
