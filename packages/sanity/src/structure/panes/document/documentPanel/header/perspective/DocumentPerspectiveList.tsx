import {Text} from '@sanity/ui'
import {memo, useCallback, useMemo} from 'react'
import {
  getReleaseTone,
  getVersionFromId,
  type ReleaseDocument,
  Translate,
  useDateTimeFormat,
  usePerspective,
  useReleases,
  useTranslation,
  versionDocumentExists,
} from 'sanity'

import {useDocumentPane} from '../../../useDocumentPane'
import {VersionChip} from './VersionChip'

type FilterReleases = {
  notCurrentReleases: ReleaseDocument[]
  currentReleases: ReleaseDocument[]
}

const TooltipContent = ({release}: {release: ReleaseDocument}) => {
  const {t} = useTranslation()
  const dateTimeFormat = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  if (release.metadata.releaseType === 'asap') {
    return <Text size={1}>{t('release.type.asap')}</Text>
  }
  if (release.metadata.releaseType === 'scheduled') {
    return (
      <Text size={1}>
        {release.metadata.intendedPublishAt ? (
          <Translate
            t={t}
            i18nKey="release.chip.tooltip.intended-for-date"
            values={{
              date: dateTimeFormat.format(new Date(release.metadata.intendedPublishAt)),
            }}
          />
        ) : (
          t('release.chip.tooltip.unknown-date')
        )}
      </Text>
    )
  }
  if (release.metadata.releaseType === 'undecided') {
    return <Text size={1}>{t('release.type.undecided')}</Text>
  }
  return null
}

export const DocumentPerspectiveList = memo(function DocumentPerspectiveList() {
  const {perspective} = usePerspective()
  const {t} = useTranslation()
  const {setPerspective} = usePerspective()
  const dateTimeFormat = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const {data: releases, loading} = useReleases()

  const {documentVersions, editState, displayed, documentType} = useDocumentPane()

  const filteredReleases: FilterReleases = useMemo(() => {
    if (!documentVersions) return {notCurrentReleases: [], currentReleases: []}

    return releases.reduce(
      (acc: FilterReleases, release) => {
        const versionDocExists = versionDocumentExists(documentVersions, release._id)
        if (versionDocExists) {
          acc.currentReleases.push(release)
        } else {
          acc.notCurrentReleases.push(release)
        }
        return acc
      },
      {notCurrentReleases: [], currentReleases: []},
    )
  }, [documentVersions, releases])

  const handleBundleChange = useCallback(
    (bundleId: string) => () => {
      setPerspective(bundleId)
    },
    [setPerspective],
  )

  return (
    <>
      <VersionChip
        tooltipContent={
          <Text size={1}>
            {editState?.published && editState?.published?._updatedAt ? (
              <Translate
                t={t}
                i18nKey="release.chip.tooltip.published-date"
                values={{date: dateTimeFormat.format(new Date(editState?.published._updatedAt))}}
              />
            ) : (
              <>{t('release.chip.tooltip.not-published')}</>
            )}
          </Text>
        }
        disabled={!editState?.published}
        onClick={handleBundleChange('published')}
        selected={
          perspective === 'published' || (!editState?.draft && !!perspective?.includes('bundle'))
        }
        text={t('release.chip.published')}
        tone="positive"
        contextValues={{
          documentId: editState?.published?._id || editState?.id || '',
          menuReleaseId: editState?.published?._id || editState?.id || '',
          releases: filteredReleases.notCurrentReleases,
          releasesLoading: loading,
          documentType,
          fromRelease: 'published',
          isVersion: false,
          disabled: !editState?.published,
        }}
      />
      <VersionChip
        tooltipContent={
          <Text size={1}>
            {editState?.draft ? (
              <>
                {editState?.draft._updatedAt ? (
                  <Translate
                    t={t}
                    i18nKey="release.chip.tooltip.edited-date"
                    values={{date: dateTimeFormat.format(new Date(editState?.draft._updatedAt))}}
                  />
                ) : (
                  <Translate
                    t={t}
                    i18nKey="release.chip.tooltip.created-date"
                    values={{date: dateTimeFormat.format(new Date(editState?.draft._createdAt))}}
                  />
                )}
              </>
            ) : (
              <>{t('release.chip.tooltip.no-edits')}</>
            )}
          </Text>
        }
        selected={
          // when the perspective is null, the draft is selected
          // when the document is not published, the draft is always selected
          // when there is no draft (new document), the draft is selected
          !!(
            typeof perspective === 'undefined' ||
            (!editState?.published && !perspective) ||
            !editState?.draft
          )
        }
        text={t('release.chip.draft')}
        tone="caution"
        onClick={handleBundleChange('drafts')}
        contextValues={{
          documentId: editState?.draft?._id || editState?.published?._id || editState?.id || '',
          menuReleaseId: editState?.draft?._id || editState?.published?._id || editState?.id || '',
          releases: filteredReleases.notCurrentReleases,
          releasesLoading: loading,
          documentType: documentType,
          fromRelease: 'draft',
          isVersion: false,
          disabled: !editState?.draft,
        }}
      />

      {displayed &&
        filteredReleases.currentReleases?.map((release) => (
          <VersionChip
            key={release._id}
            tooltipContent={<TooltipContent release={release} />}
            selected={release.name === getVersionFromId(displayed?._id || '')}
            onClick={handleBundleChange(release.name)}
            text={release.metadata.title || t('release.placeholder-untitled-release')}
            tone={getReleaseTone(release)}
            contextValues={{
              documentId: displayed?._id || '',
              menuReleaseId: release._id,
              releases: filteredReleases.notCurrentReleases,
              releasesLoading: loading,
              documentType: documentType,
              fromRelease: release.name,
              isVersion: true,
            }}
          />
        ))}
    </>
  )
})
