import {type SchemaType} from '@sanity/types'
import {Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {PreviewCard} from '../../../../components/previewCard/PreviewCard'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {SanityDefaultPreview} from '../../../../preview/components/SanityDefaultPreview'
import {type DocumentPreviewStore} from '../../../../preview/documentPreviewStore'
import {getPreviewStateObservable} from '../../../../preview/utils/getPreviewStateObservable'
import {getPreviewValueWithFallback} from '../../../../preview/utils/getPreviewValueWithFallback'
import {VersionInlineBadge} from '../../../../releases/components/VersionInlineBadge'
import {useActiveReleases} from '../../../../releases/store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {getReleaseTone} from '../../../../releases/util/getReleaseTone'
import {getVersionFromId, isDraftId, isPublishedId, isVersionId} from '../../../../util/draftUtils'

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

  const badgeProps = useMemo(() => {
    const id = value._id
    if (isDraftId(id)) {
      return {tone: getReleaseTone('drafts'), text: t('release.chip.draft')}
    }
    if (isPublishedId(id)) {
      return {tone: getReleaseTone('published'), text: t('release.chip.published')}
    }
    if (isVersionId(id)) {
      const releaseId = getVersionFromId(id)
      const release = releases.find((r) => getReleaseIdFromReleaseDocumentId(r._id) === releaseId)
      if (release) {
        return {tone: getReleaseTone(release), text: release.metadata.title}
      }
    }
    return null
  }, [releases, value._id, t])

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
