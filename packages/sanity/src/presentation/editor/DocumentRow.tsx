import {type HTMLProps, useCallback, useEffect, useMemo, useState} from 'react'
import {
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  type PreviewValue,
  PreviewCard,
  type SanityDocument,
  SanityDefaultPreview,
  useDocumentPreviewStore,
  usePerspective,
  useSchema,
} from 'sanity'
import {StateLink} from 'sanity/router'

import {type PresentationSearchParams} from '../types'

interface PreviewState {
  isLoading?: boolean
  snapshot?: PreviewValue | Partial<SanityDocument> | null
}

/**
 * One row in the presentation "Documents on this page" list.
 *
 * Renders a preview for `id` of `_type`, wrapped in a `StateLink` that opens
 * the document in the structure pane. Subscribes to preview snapshots through
 * `getPreviewStateObservable` so the preview reflects the current perspective
 * stack (published / drafts / release) — same as `PaneItemPreview`.
 *
 * We render the row ourselves (rather than handing the list to the structure
 * tool's DocumentListPane) so the array order encoded in `refs` is preserved.
 * See https://github.com/sanity-io/sanity/issues/12956.
 */
export function DocumentRow(props: {
  id: string
  schemaTypeName: string
  searchParams: PresentationSearchParams
}): React.JSX.Element | null {
  const {id, schemaTypeName, searchParams} = props

  const schema = useSchema()
  const schemaType = schema.get(schemaTypeName)
  const documentPreviewStore = useDocumentPreviewStore()
  const {perspectiveStack} = usePerspective()

  const [preview, setPreview] = useState<PreviewState>({isLoading: true, snapshot: null})

  useEffect(() => {
    if (!schemaType) return undefined
    const subscription = getPreviewStateObservable(
      documentPreviewStore,
      schemaType,
      id,
      perspectiveStack,
    ).subscribe((state) => {
      setPreview({isLoading: state.isLoading, snapshot: state.snapshot})
    })
    return () => subscription.unsubscribe()
  }, [documentPreviewStore, id, perspectiveStack, schemaType])

  const Link = useCallback(
    (linkProps: HTMLProps<HTMLAnchorElement>) => (
      <StateLink
        {...linkProps}
        state={{
          id,
          type: schemaTypeName,
          _searchParams: Object.entries(searchParams),
        }}
      />
    ),
    [id, schemaTypeName, searchParams],
  )

  const fallback = useMemo(() => ({_id: id, _type: schemaTypeName}), [id, schemaTypeName])

  if (!schemaType) {
    return null
  }

  return (
    <PreviewCard
      __unstable_focusRing
      // oxlint-disable-next-line no-explicit-any
      as={Link as any}
      data-as="a"
      data-testid="presentation-document-row"
      data-id={id}
      padding={2}
      radius={2}
      sizing="border"
      tone="inherit"
    >
      <SanityDefaultPreview
        {...getPreviewValueWithFallback({snapshot: preview.snapshot, fallback})}
        isPlaceholder={preview.isLoading}
        schemaType={schemaType}
      />
    </PreviewCard>
  )
}
