import {type SchemaType} from '@sanity/types'
import {Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  type DocumentPreviewStore,
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  getVersionFromId,
  isDraftId,
  isPublishedId,
  isVersionId,
  PreviewCard,
  SanityDefaultPreview,
  useActiveReleases,
  VersionInlineBadge,
} from 'sanity'

export interface LinkToExistingPreviewProps {
  documentPreviewStore: DocumentPreviewStore
  schemaType: SchemaType
  value: {_id: string; _type: string}
  onLinkToDocument: () => void
}

const getPerspective = (id: string) => {
  if (isDraftId(id)) return ['drafts']
  if (isVersionId(id)) return [getVersionFromId(id) as string]
  if (isPublishedId(id)) return ['published']
  return ['raw']
}

export function LinkToExistingPreview(props: LinkToExistingPreviewProps) {
  const {schemaType, value, onLinkToDocument} = props
  const {data: releases} = useActiveReleases()

  const previewStateObservable = useMemo(() => {
    return getPreviewStateObservable(
      props.documentPreviewStore,
      schemaType,
      value._id,
      getPerspective(value._id),
    )
  }, [props.documentPreviewStore, schemaType, value._id])

  const {snapshot, original, isLoading} = useObservable(previewStateObservable, {
    snapshot: null,
    isLoading: true,
    original: null,
  })

  const badgeProps = useMemo(() => {
    const id = value._id
    if (isDraftId(id)) {
      return {tone: getReleaseTone('drafts'), text: 'Draft'}
    }
    if (isPublishedId(id)) {
      return {tone: getReleaseTone('published'), text: 'Published'}
    }
    if (isVersionId(id)) {
      const releaseId = getVersionFromId(id)
      const release = releases.find((r) => getReleaseIdFromReleaseDocumentId(r._id) === releaseId)
      if (release) {
        return {tone: getReleaseTone(release), text: release.metadata.title}
      }
    }
    return null
  }, [releases, value._id])

  return (
    <PreviewCard __unstable_focusRing onClick={onLinkToDocument} as="button" radius={2}>
      <SanityDefaultPreview
        {...getPreviewValueWithFallback({snapshot, original, fallback: value})}
        isPlaceholder={isLoading}
        icon={schemaType.icon}
        layout="default"
        status={
          badgeProps ? (
            <Text size={0}>
              <VersionInlineBadge $tone={badgeProps.tone}>{badgeProps.text}</VersionInlineBadge>
            </Text>
          ) : undefined
        }
      />
    </PreviewCard>
  )
}
