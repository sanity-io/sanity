import {type Path} from '@sanity/types'
import {useCallback, useMemo} from 'react'

import {useDocumentPane} from '../useDocumentPane'
import {getDocumentTitleFieldPath} from './getDocumentTitleFieldPath'

export interface DocumentTitleField {
  /** The `preview.select.title` path, when it names a field on this document. */
  path: Path | undefined
  /** Whether clicking the title can put the cursor in that field. */
  editable: boolean
  /**
   * Opens and focuses the title field through the document pane.
   *
   * A `<label htmlFor>` is the wrong control here. Form input ids are only in
   * the DOM once the field is mounted, so a label cannot open a field that sits
   * in a collapsed object, fieldset, or inactive field group, and a second
   * label would compete with the field's own label. `onPathOpen` runs the
   * form's expand operations (ancestors, fieldsets, field groups) and
   * `onFocus` moves focus onto the field once it is mounted. The same pair is
   * how validation markers jump to a field.
   */
  focus: () => void
}

/**
 * The document title is rendered in two places, the pane header and the form's
 * own heading. Both resolve the field behind it the same way.
 */
export function useDocumentTitleField(): DocumentTitleField {
  const {formState, onFocus, onPathOpen, schemaType} = useDocumentPane()
  const path = useMemo(() => getDocumentTitleFieldPath(schemaType), [schemaType])

  // Read-only forms (history, permissions, published perspective, …) cannot
  // edit the field.
  const editable = Boolean(path && formState && !formState.readOnly)

  const focus = useCallback(() => {
    if (!path) return
    onPathOpen(path)
    onFocus(path)
  }, [onFocus, onPathOpen, path])

  return {path, editable, focus}
}
