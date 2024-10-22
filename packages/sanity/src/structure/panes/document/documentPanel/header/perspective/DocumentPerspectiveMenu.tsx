import {Text} from '@sanity/ui'
import {memo, useCallback} from 'react'
import {
  getReleaseTone,
  getVersionFromId,
  isVersionId,
  Translate,
  useDateTimeFormat,
  usePerspective,
  useReleases,
  useTranslation,
  versionDocumentExists,
} from 'sanity'
import {useDocumentPane, usePaneRouter} from 'sanity/structure'

import {VersionChip} from './VersionChip'

export const DocumentPerspectiveMenu = memo(function DocumentPerspectiveMenu() {
  const {perspective} = usePaneRouter()
  const {t} = useTranslation()
  const {setPerspective} = usePerspective(perspective)
  const dateTimeFormat = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const {data: releases, loading} = useReleases()

  const {documentVersions, editState, displayed, documentType} = useDocumentPane()

  // remove the versions that the document already has
  // remove the archived releases
  const filteredReleases =
    (documentVersions &&
      releases?.filter(
        (release) =>
          !versionDocumentExists(documentVersions, release._id) && release.state !== 'archived',
      )) ||
    []

  const asapReleases = documentVersions?.filter(
    (release) => release.metadata.releaseType === 'asap',
  )

  const scheduledReleases = documentVersions?.filter((release) => release.state === 'scheduled')
  const undecidedReleases = documentVersions?.filter(
    (release) => release.metadata.releaseType === 'undecided',
  )

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
        selected={perspective === 'published'}
        text={t('release.chip.published')}
        tone="positive"
        contextValues={{
          documentId: editState?.published?._id || editState?.id || '',
          menuReleaseId: editState?.published?._id || editState?.id || '',
          releases: filteredReleases,
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
          (editState?.draft?._id === displayed?._id ||
            !editState?.draft ||
            !editState?.published) &&
          !isVersionId(displayed?._id || '') &&
          perspective !== 'published'
        }
        text={t('release.chip.draft')}
        tone="caution"
        onClick={handleBundleChange('drafts')}
        contextValues={{
          documentId: editState?.draft?._id || editState?.published?._id || editState?.id || '',
          menuReleaseId: editState?.draft?._id || editState?.published?._id || editState?.id || '',
          releases: filteredReleases,
          releasesLoading: loading,
          documentType: documentType,
          fromRelease: 'draft',
          isVersion: false,
          disabled: !editState?.draft,
        }}
      />

      {displayed &&
        asapReleases?.map((release) => (
          <VersionChip
            key={release._id}
            tooltipContent={<Text size={1}>{t('release.type.asap')}</Text>}
            selected={release._id === getVersionFromId(displayed?._id || '')}
            onClick={handleBundleChange(release._id)}
            text={release.metadata.title}
            tone={getReleaseTone(release)}
            contextValues={{
              documentId: displayed?._id || '',
              menuReleaseId: release._id,
              releases: filteredReleases,
              releasesLoading: loading,
              documentType: documentType,
              fromRelease: release._id,
              isVersion: true,
            }}
          />
        ))}
      {/** @todo missing check if release is scheduled or only has a date version.scheduled ? */}
      {displayed &&
        scheduledReleases?.map((release) => (
          <VersionChip
            key={release._id}
            tooltipContent={
              <Text size={1}>
                {release.metadata.intendedPublishAt ? (
                  <Translate
                    t={t}
                    i18nKey="release.chip.tooltip.intended-for-date"
                    values={{date: dateTimeFormat.format(new Date(release.metadata.intendedPublishAt))}}
                  />
                ) : (
                  t('release.chip.tooltip.unknown-date')
                )}
              </Text>
            }
            selected={release._id === getVersionFromId(displayed?._id || '')}
            onClick={handleBundleChange(release._id)}
            text={release.metadata.title}
            tone={getReleaseTone(release)}
            contextValues={{
              documentId: displayed?._id || '',
              menuReleaseId: release._id,
              releases: filteredReleases,
              releasesLoading: loading,
              documentType: documentType,
              fromRelease: release._id,
              isVersion: true,
            }}
          />
        ))}
      {displayed &&
        undecidedReleases?.map((release) => (
          <VersionChip
            key={release._id}
            tooltipContent={t('release.type.undecided')}
            selected={release._id === getVersionFromId(displayed?._id || '')}
            onClick={handleBundleChange(release._id)}
            text={release.metadata.title}
            tone={getReleaseTone(release)}
            contextValues={{
              documentId: displayed?._id || '',
              menuReleaseId: release._id,
              releases: filteredReleases,
              releasesLoading: loading,
              documentType: documentType,
              fromRelease: release._id,
              isVersion: true,
            }}
          />
        ))}
    </>
  )
})
