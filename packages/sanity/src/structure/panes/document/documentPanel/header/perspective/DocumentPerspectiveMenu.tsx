import {Text} from '@sanity/ui'
import {memo, useCallback} from 'react'
import {
  getReleaseTone,
  getVersionFromId,
  isVersionId,
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
  const {t} = useTranslation() // @todo add and update translations
  const {setPerspective} = usePerspective(perspective)
  const dateTimeFormat = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const {data: bundles, loading} = useReleases()

  const {documentVersions, editState, displayed, documentType} = useDocumentPane()

  // remove the versions that the document already has
  // remove the archived releases
  const filteredReleases =
    (documentVersions &&
      bundles?.filter(
        (bundle) => !versionDocumentExists(documentVersions, bundle._id) && !bundle.archivedAt,
      )) ||
    []

  const asapReleases = documentVersions?.filter((release) => release.releaseType === 'asap')

  const scheduledReleases = documentVersions?.filter(
    (release) => release.releaseType === 'scheduled',
  )
  const undecidedReleases = documentVersions?.filter(
    (release) => release.releaseType === 'undecided',
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
              // eslint-disable-next-line i18next/no-literal-string
              <>Published {dateTimeFormat.format(new Date(editState?.published._updatedAt))}</>
            ) : (
              // eslint-disable-next-line i18next/no-literal-string
              <>Not published</>
            )}
          </Text>
        }
        disabled={!editState?.published}
        onClick={handleBundleChange('published')}
        selected={perspective === 'published'}
        // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
        text="Published"
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
                {editState?.draft.updatedAt ? (
                  // eslint-disable-next-line i18next/no-literal-string
                  <>Edited {dateTimeFormat.format(new Date(editState?.draft._updatedAt))}</>
                ) : (
                  // eslint-disable-next-line i18next/no-literal-string
                  <>Created {dateTimeFormat.format(new Date(editState?.draft._createdAt))}</>
                )}
              </>
            ) : (
              // eslint-disable-next-line i18next/no-literal-string
              <>No edits</>
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
        // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
        text="Draft"
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
      {/* @todo update temporary text for tooltip */}
      {displayed &&
        asapReleases?.map((release) => (
          <VersionChip
            key={release._id}
            // eslint-disable-next-line i18next/no-literal-string
            tooltipContent={<Text size={1}>ASAP</Text>}
            selected={release._id === getVersionFromId(displayed?._id || '')}
            onClick={handleBundleChange(release._id)}
            text={release.title}
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
      {/* @todo missing check if release is scheduled or only has a date version.scheduled ? */}
      {displayed &&
        scheduledReleases?.map((release) => (
          <VersionChip
            key={release._id}
            // eslint-disable-next-line i18next/no-literal-string
            tooltipContent={
              <Text size={1}>
                {release.publishedAt
                  ? `Intended for ${dateTimeFormat.format(new Date(release.publishedAt))}`
                  : 'Unknown date'}
              </Text>
            }
            selected={release._id === getVersionFromId(displayed?._id || '')}
            onClick={handleBundleChange(release._id)}
            text={release.title}
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
            // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
            tooltipContent={'Undecided'}
            selected={release._id === getVersionFromId(displayed?._id || '')}
            onClick={handleBundleChange(release._id)}
            text={release.title}
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
