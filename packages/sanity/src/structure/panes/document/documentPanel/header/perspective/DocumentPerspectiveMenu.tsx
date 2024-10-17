import {DotIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import {memo, useCallback} from 'react'
import {
  getVersionFromId,
  isVersionId,
  useBundles,
  useDateTimeFormat,
  usePerspective,
  useTranslation,
} from 'sanity'

import {RELEASETYPE, versionDocumentExists} from '../../../../../../core/releases'
import {usePaneRouter} from '../../../../../components'
import {useDocumentPane} from '../../../useDocumentPane'
import {VersionChip} from './VersionChip'
import {VersionPopoverMenu} from './VersionPopoverMenu'

export const DocumentPerspectiveMenu = memo(function DocumentPerspectiveMenu() {
  const {perspective} = usePaneRouter()
  const {t} = useTranslation() // @todo add and update translations
  const {setPerspective} = usePerspective(perspective)
  const dateTimeFormat = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const {data: bundles, loading} = useBundles()

  const {documentVersions, editState, displayed, documentType} = useDocumentPane()

  // remove the versions that the document already has
  // remove the archived releases
  const filteredReleases =
    (documentVersions &&
      bundles?.filter(
        (bundle) => !versionDocumentExists(documentVersions, bundle._id) && !bundle.archivedAt,
      )) ||
    []

  const asapReleases = documentVersions?.filter(
    (release) => release.releaseType === RELEASETYPE.asap.name,
  )

  const scheduledReleases = documentVersions?.filter(
    (release) => release.releaseType === RELEASETYPE.scheduled.name,
  )
  const undecidedReleases = documentVersions?.filter(
    (release) => release.releaseType === RELEASETYPE.undecided.name,
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
        icon={DotIcon}
        tone="positive"
        menuContent={
          editState?.published ? (
            <VersionPopoverMenu
              documentId={editState?.published?._id || ''}
              menuReleaseId={editState?.published?._id || ''}
              releases={filteredReleases}
              releasesLoading={loading}
              documentType={documentType}
              fromRelease={''}
              isVersion={false}
            />
          ) : null
        }
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
        icon={DotIcon}
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
        menuContent={
          <VersionPopoverMenu
            documentId={editState?.draft?._id || editState?.published?._id || ''}
            menuReleaseId={editState?.draft?._id || editState?.published?._id || ''}
            releases={filteredReleases}
            releasesLoading={loading}
            documentType={documentType}
            fromRelease={''}
            isVersion={false}
          />
        }
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
            tone={RELEASETYPE[release.releaseType]?.tone}
            icon={DotIcon}
            menuContent={
              <VersionPopoverMenu
                documentId={displayed?._id || ''}
                menuReleaseId={release._id}
                releases={filteredReleases}
                releasesLoading={loading}
                documentType={documentType}
                fromRelease={release._id}
                isVersion
              />
            }
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
            tone={RELEASETYPE[release.releaseType]?.tone}
            icon={DotIcon}
            menuContent={
              <VersionPopoverMenu
                documentId={displayed?._id || ''}
                menuReleaseId={release._id}
                releases={filteredReleases}
                releasesLoading={loading}
                documentType={documentType}
                fromRelease={release._id}
                isVersion
              />
            }
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
            tone={RELEASETYPE[release.releaseType]?.tone}
            icon={DotIcon}
            menuContent={
              <VersionPopoverMenu
                documentId={displayed?._id || ''}
                menuReleaseId={release._id}
                releases={filteredReleases}
                releasesLoading={loading}
                documentType={documentType}
                fromRelease={release._id}
                isVersion
              />
            }
          />
        ))}
    </>
  )
})
