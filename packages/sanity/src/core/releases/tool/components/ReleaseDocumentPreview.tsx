import {type ReleaseState} from '@sanity/client'
import {type PreviewValue} from '@sanity/types'
import {Card} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useEffect, useMemo, useRef, useState} from 'react'
import {IntentLink} from 'sanity/router'

import {type PreviewLayoutKey} from '../../../components/previews/types'
import {useSchema} from '../../../hooks'
import {DocumentPreviewPresence} from '../../../presence'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {type PreviewableType} from '../../../preview/types'
import {useDocumentPreviewStore} from '../../../store/_legacy/datastores'
import {useDocumentPresence} from '../../../store/_legacy/presence/useDocumentPresence'
import {getPublishedId} from '../../../util/draftUtils'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'

interface ReleaseDocumentPreviewProps {
  documentId: string
  documentTypeName: string
  releaseId: string
  releaseState?: ReleaseState
  documentRevision?: string
  hasValidationError?: boolean
  layout?: PreviewLayoutKey
}

const isArchivedRelease = (releaseState: ReleaseState | undefined) =>
  releaseState === 'archived' || releaseState === 'archiving' || releaseState === 'unarchiving'

export function ReleaseDocumentPreview({
  documentId,
  documentTypeName,
  releaseId,
  releaseState,
  documentRevision,
  layout,
}: ReleaseDocumentPreviewProps) {
  const documentPresence = useDocumentPresence(documentId)
  const documentPreviewStore = useDocumentPreviewStore()
  const schema = useSchema()

  // Local preview state to support lazy fetching when `previewValues` are not provided
  const [resolvedPreview, setResolvedPreview] = useState<PreviewValue | undefined | null>(undefined)
  const [previewLoading, setPreviewLoading] = useState<boolean>(true)
  const subscriptionRef = useRef<(() => void) | null>(null)

  const intentParams = useMemo(() => {
    if (releaseState === 'published') {
      // We are inspecting this document through the published view of the doc.
      return {
        rev: `@release:${getReleaseIdFromReleaseDocumentId(releaseId)}`,
        inspect: 'sanity/structure/history',
      }
    }

    if (releaseState === 'archived') {
      // We are "faking" the release as if it is still valid only to render the document
      return {
        rev: '@lastEdited',
        inspect: 'sanity/structure/history',
        historyEvent: documentRevision,
        historyVersion: getReleaseIdFromReleaseDocumentId(releaseId),
        archivedRelease: 'true',
      }
    }

    return {}
  }, [releaseState, releaseId, documentRevision])

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(linkProps, ref: ForwardedRef<HTMLAnchorElement>) {
        return (
          <IntentLink
            {...linkProps}
            intent="edit"
            params={{
              id: getPublishedId(documentId),
              type: documentTypeName,
              ...intentParams,
            }}
            searchParams={
              isArchivedRelease(releaseState)
                ? undefined
                : [
                    [
                      'perspective',
                      releaseState === 'published'
                        ? 'published'
                        : getReleaseIdFromReleaseDocumentId(releaseId),
                    ],
                  ]
            }
            ref={ref}
          />
        )
      }),
    [documentId, documentTypeName, intentParams, releaseState, releaseId],
  )

  const previewPresence = useMemo(
    () => documentPresence?.length > 0 && <DocumentPreviewPresence presence={documentPresence} />,
    [documentPresence],
  )

  // Keep a ref of resolved preview to avoid re-subscribing when it changes
  const resolvedPreviewRef = useRef<PreviewValue | undefined | null>(resolvedPreview)
  useEffect(() => {
    resolvedPreviewRef.current = resolvedPreview
  }, [resolvedPreview])

  // Lazily fetch preview for the specific row on mount/visibility
  useEffect(() => {
    const schemaType = schema.get(documentTypeName)
    if (!schemaType) {
      // Fallback: schema type missing
      setResolvedPreview({
        _id: documentId,
        title: `Document type "${documentTypeName}" not found`,
      })
      setPreviewLoading(false)
    }

    const subscribe = (id: string, perspective: string[] | undefined) => {
      const sub = documentPreviewStore
        .observeForPreview(
          {
            _id: id,
            _type: documentTypeName,
          },
          schemaType as PreviewableType,
          {perspective},
        )
        .subscribe((value) => {
          // If snapshot available, use it
          if (value?.snapshot) {
            setResolvedPreview(value.snapshot)
            setPreviewLoading(false)
          }
        })
      return () => sub.unsubscribe()
    }

    // Active releases: try release perspective first, then published fallback
    if (releaseState !== 'archived' && releaseState !== 'published') {
      const unsubscribeRelease = subscribe(documentId, [
        getReleaseIdFromReleaseDocumentId(releaseId),
      ])

      // Also set a short-lived fallback listener to published if the first emission has no snapshot
      // We simulate the previous behavior by scheduling a microtask to check state
      const fallbackTimeout = setTimeout(() => {
        if (resolvedPreviewRef.current === null || resolvedPreviewRef.current === undefined) {
          const unsubscribePublished = subscribe(getPublishedId(documentId), [])
          subscriptionRef.current = () => {
            unsubscribeRelease()
            unsubscribePublished()
          }
        }
      }, 0)

      subscriptionRef.current = () => {
        unsubscribeRelease()
        clearTimeout(fallbackTimeout)
      }
    } else {
      // Published/archived: just fetch once from published view (no perspective)
      const unsubscribe = subscribe(documentId, undefined)
      subscriptionRef.current = unsubscribe
    }
  }, [documentId, documentTypeName, documentPreviewStore, releaseId, releaseState, schema])

  return (
    <Card tone="inherit" as={LinkComponent} radius={2} data-as="a">
      <SanityDefaultPreview
        {...(resolvedPreview || {})}
        status={previewPresence}
        isPlaceholder={previewLoading}
        layout={layout}
      />
    </Card>
  )
}
