import {Text} from '@sanity/ui'
import {memo, useCallback, useMemo} from 'react'
import {
  formatRelativeLocalePublishDate,
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  getVersionFromId,
  isReleaseScheduledOrScheduling,
  type ReleaseDocument,
  Translate,
  useDateTimeFormat,
  usePerspective,
  useReleases,
  useTranslation,
  VersionChip,
  versionDocumentExists,
} from 'sanity'
import {usePaneRouter} from 'sanity/structure'

import {useDocumentPane} from '../../../useDocumentPane'

type FilterReleases = {
  notCurrentReleases: ReleaseDocument[]
  currentReleases: ReleaseDocument[]
}

const TooltipContent = ({release}: {release: ReleaseDocument}) => {
  const {t} = useTranslation()

  if (release.metadata.releaseType === 'asap') {
    return <Text size={1}>{t('release.type.asap')}</Text>
  }
  if (release.metadata.releaseType === 'scheduled') {
    const isActive = release.state === 'active'

    return (
      release.metadata.intendedPublishAt && (
        <Text size={1}>
          {isActive ? (
            <Translate
              t={t}
              i18nKey="release.chip.tooltip.intended-for-date"
              values={{
                date: formatRelativeLocalePublishDate(release),
              }}
            />
          ) : (
            <Translate
              t={t}
              i18nKey="release.chip.tooltip.scheduled-for-date"
              values={{
                date: formatRelativeLocalePublishDate(release),
              }}
            />
          )}
        </Text>
      )
    )
  }

  if (release.metadata.releaseType === 'undecided') {
    return <Text size={1}>{t('release.type.undecided')}</Text>
  }
  return null
}

export const DocumentPerspectiveList = memo(function DocumentPerspectiveList() {
  const {selectedPerspectiveName} = usePerspective()
  const {t} = useTranslation()
  const {setPerspective} = usePerspective()
  const {params} = usePaneRouter()
  const dateTimeFormat = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const {data: releases, loading, archivedReleases} = useReleases()

  const {documentVersions, editState, displayed, documentType} = useDocumentPane()

  const filteredReleases: FilterReleases = useMemo(() => {
    if (!documentVersions) return {notCurrentReleases: [], currentReleases: []}

    const activeReleases = releases.reduce(
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

    // without historyVersion, version is not in an archived release
    if (!params?.historyVersion) return activeReleases

    const archivedRelease = archivedReleases.find(
      (r) => getReleaseIdFromReleaseDocumentId(r._id) === params?.historyVersion,
    )

    // only for explicitly archived releases; published releases use published perspective
    if (archivedRelease?.state === 'archived') {
      activeReleases.currentReleases.push(archivedRelease)
    }

    return activeReleases
  }, [archivedReleases, documentVersions, params?.historyVersion, releases])

  const handleBundleChange = useCallback(
    (bundleId: string) => () => {
      setPerspective(bundleId)
    },
    [setPerspective],
  )

  const isPublishedChipDisabled = useMemo(() => {
    // If it's a live edit document the only option to edit it is through
    // the published perspective, users should be able to select it.
    if (editState?.liveEdit) return false

    // If it's not live edit, we want to check for the existence of the published doc.
    return !editState?.published
  }, [editState?.liveEdit, editState?.published])

  const getReleaseChipState = useCallback(
    (release: ReleaseDocument): {selected: boolean; disabled?: boolean} => {
      if (!params?.historyVersion)
        return {selected: release.name === getVersionFromId(displayed?._id || '')}

      const isReleaseHistoryMatch =
        getReleaseIdFromReleaseDocumentId(release._id) === params.historyVersion

      return {selected: isReleaseHistoryMatch, disabled: isReleaseHistoryMatch}
    },
    [displayed?._id, params?.historyVersion],
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
        disabled={isPublishedChipDisabled}
        onClick={handleBundleChange('published')}
        selected={
          /** the publish is selected when:
           * when the document displayed is a published document, but has no draft and the perspective that is
           * selected is the null perspective - this means that it should be showing draft
           * when the perspective is published
           */
          !!(
            (editState?.published?._id === displayed?._id &&
              !editState?.draft &&
              selectedPerspectiveName) ||
            selectedPerspectiveName === 'published'
          )
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
          /** the draft is selected when:
           * not viewing a historical version,
           * when the document displayed is a draft,
           * when the perspective is null,
           * when the document is not published and the displayed version is draft,
           * when there is no draft (new document),
           */
          !!(
            !params?.historyVersion &&
            (editState?.draft?._id === displayed?._id ||
              !selectedPerspectiveName ||
              (!editState?.published &&
                editState?.draft &&
                editState?.draft?._id === displayed?._id) ||
              (!editState?.published && !editState?.draft))
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
            {...getReleaseChipState(release)}
            onClick={handleBundleChange(release.name)}
            text={release.metadata.title || t('release.placeholder-untitled-release')}
            tone={getReleaseTone(release)}
            locked={isReleaseScheduledOrScheduling(release)}
            contextValues={{
              documentId: displayed?._id || '',
              menuReleaseId: release._id,
              releases: filteredReleases.notCurrentReleases,
              releasesLoading: loading,
              documentType: documentType,
              fromRelease: release.name,
              releaseState: release.state,
              isVersion: true,
            }}
          />
        ))}
    </>
  )
})
