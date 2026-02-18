import {type SchemaType} from '@sanity/types'
import {type BadgeTone, Text} from '@sanity/ui'
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
  ReleaseTitle,
  SanityDefaultPreview,
  useActiveReleases,
  useTranslation,
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
  const {t} = useTranslation()

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

  const badgeProps = useMemo(():
    | {kind: 'static'; tone: BadgeTone; text: string}
    | {kind: 'release'; tone: BadgeTone; releaseTitle: string | undefined; releaseFallback: string}
    | null => {
    const id = value._id
    if (isDraftId(id)) {
      return {
        kind: 'static',
        tone: getReleaseTone('drafts'),
        text: t('release.chip.draft'),
      }
    }
    if (isPublishedId(id)) {
      return {
        kind: 'static',
        tone: getReleaseTone('published'),
        text: t('release.chip.published'),
      }
    }
    if (isVersionId(id)) {
      const releaseId = getVersionFromId(id)
      const release = releases.find((r) => getReleaseIdFromReleaseDocumentId(r._id) === releaseId)
      if (release) {
        return {
          kind: 'release',
          tone: getReleaseTone(release),
          releaseTitle: release.metadata.title,
          releaseFallback: release._id,
        }
      }
    }
    return null
  }, [releases, value._id, t])

  /**
   * If the document is not found, for example because it will be unpublished.
   * Then we don't want to render the preview of it. Because it shouldn't be possible
   * to link to a document that will be unpublished in this same release
   */
  if (!snapshot && !isLoading) return null
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
              {badgeProps.kind === 'release' ? (
                <ReleaseTitle title={badgeProps.releaseTitle} fallback={badgeProps.releaseFallback}>
                  {({displayTitle}) => (
                    <VersionInlineBadge $tone={badgeProps.tone}>{displayTitle}</VersionInlineBadge>
                  )}
                </ReleaseTitle>
              ) : (
                <VersionInlineBadge $tone={badgeProps.tone}>{badgeProps.text}</VersionInlineBadge>
              )}
            </Text>
          ) : undefined
        }
      />
    </PreviewCard>
  )
}
