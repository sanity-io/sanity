import {useEditor, useEditorSelector} from '@portabletext/editor'
import {
  type ApplicableSchema,
  compareApplicableSchema,
  getApplicableSchema,
} from '@portabletext/editor/selectors'

export type {ApplicableSchema}

/**
 * The schema members applicable at the current selection, as name sets per
 * category, with a stable reference across editor ticks while the sets are
 * unchanged. Inside a container child (a table cell, for example) the sets
 * reflect that position's block config rather than the root field's.
 *
 * Duplicated from `@portabletext/toolbar`'s `useApplicableSchema` rather
 * than depending on that package for one hook; keep in sync with the
 * source.
 */
export function useApplicableSchema(): ApplicableSchema {
  const editor = useEditor()
  return useEditorSelector(editor, getApplicableSchema, compareApplicableSchema)
}
