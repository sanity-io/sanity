/** Set by `PaneHeader` on its title. */
const PANE_HEADER_TITLE_SELECTOR = '[data-pane-header-title]'
/** Set by `DocumentHeaderTitle` on the button that moves focus to the title field. */
const DOCUMENT_TITLE_BUTTON_SELECTOR = '[data-document-pane-title-button]'

/**
 * Focuses the document title in the header of the pane that contains `element`: the title
 * button when the title is editable, otherwise the header title itself, which keeps its
 * `tabIndex` for this. Starting there gives the same Tab order whether or not the form has an
 * interactive title or a schema description, and a screen reader announces the document that
 * just opened.
 *
 * Returns `false` when `element` is not inside a pane with a title that can take focus.
 */
export function focusDocumentPaneTitle(element: HTMLElement): boolean {
  const title = element
    .closest<HTMLElement>('[data-ui="Pane"]')
    ?.querySelector<HTMLElement>(PANE_HEADER_TITLE_SELECTOR)
  if (!title) return false

  const target = title.querySelector<HTMLElement>(DOCUMENT_TITLE_BUTTON_SELECTOR) ?? title
  target.focus()
  return element.ownerDocument.activeElement === target
}
