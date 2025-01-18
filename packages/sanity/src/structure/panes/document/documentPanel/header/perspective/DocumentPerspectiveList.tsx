import {Text} from '@sanity/ui'
import {memo, useCallback, useMemo} from 'react'
import {
  formatRelativeLocalePublishDate,
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  getVersionFromId,
  isDraftId,
  isPublishedId,
  isPublishedPerspective,
  isReleaseScheduledOrScheduling,
  isVersionId,
  type ReleaseDocument,
  Translate,
  useActiveReleases,
  useArchivedReleases,
  useDateTimeFormat,
  useDocumentVersions,
  usePerspective,
  useSchema,
  useTranslation,
  VersionChip,
} from 'sanity'
import {usePaneRouter} from 'sanity/structure'

import {useDocumentPane} from '../../../useDocumentPane'

type FilterReleases = {
  notCurrentReleases: ReleaseDocument[]
  currentReleases: ReleaseDocument[]
  inCreation: ReleaseDocument[]
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
  const {setPerspective, selectedReleaseId} = usePerspective()
  const {params} = usePaneRouter()
  const dateTimeFormat = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const {data: releases, loading} = useActiveReleases()
  const {data: archivedReleases} = useArchivedReleases()
  const schema = useSchema()
  const {editState, displayed, documentType, documentId} = useDocumentPane()
  const {data: documentVersions} = useDocumentVersions({documentId})
  const isCreatingDocument = displayed && !displayed._createdAt

  const filteredReleases: FilterReleases = useMemo(() => {
    if (!documentVersions) return {notCurrentReleases: [], currentReleases: [], inCreation: []}
    // Gets the releases ids from the document versions, it means, the releases that the document is part of
    const versionsIds = documentVersions.map((id) => getVersionFromId(id))
    const activeReleases = releases.reduce(
      (acc: FilterReleases, release) => {
        const versionDocExists = versionsIds.includes(
          getReleaseIdFromReleaseDocumentId(release._id),
        )
        const releaseId = getReleaseIdFromReleaseDocumentId(release._id)
        const isCreatingThisVersion =
          isCreatingDocument &&
          releaseId === getVersionFromId(displayed._id || '') &&
          releaseId === selectedReleaseId

        if (isCreatingThisVersion) {
          acc.inCreation.push(release)
        } else if (versionDocExists) {
          acc.currentReleases.push(release)
        } else {
          acc.notCurrentReleases.push(release)
        }
        return acc
      },
      {notCurrentReleases: [], currentReleases: [], inCreation: []},
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
  }, [
    archivedReleases,
    isCreatingDocument,
    displayed?._id,
    documentVersions,
    params?.historyVersion,
    releases,
    selectedReleaseId,
  ])

  const handlePerspectiveChange = useCallback(
    (perspective: Parameters<typeof setPerspective>[0]) => () => {
      setPerspective(perspective)
    },
    [setPerspective],
  )

  const isPublishedChipDisabled = useMemo(() => {
    const schemaType = schema.get(documentType)
    // If it's a live edit document the only option to edit it is through
    // the published perspective, users should be able to select it.
    if (schemaType?.liveEdit) return false

    // If it's not live edit, we want to check for the existence of the published doc.
    return !editState?.published
  }, [schema, documentType, editState?.published])

  const getReleaseChipState = useCallback(
    (release: ReleaseDocument): {selected: boolean; disabled?: boolean} => {
      if (!params?.historyVersion)
        return {
          selected:
            getReleaseIdFromReleaseDocumentId(release._id) ===
            getVersionFromId(displayed?._id || ''),
        }

      const isReleaseHistoryMatch =
        getReleaseIdFromReleaseDocumentId(release._id) === params.historyVersion

      return {selected: isReleaseHistoryMatch, disabled: isReleaseHistoryMatch}
    },
    [displayed?._id, params?.historyVersion],
  )

  const isPublishSelected: boolean = useMemo(() => {
    /** the publish is selected when:
     * when the document displayed is a published document, but has no draft and the perspective that is
     * selected is the null perspective - this means that it should be showing draft
     * when the perspective is published
     */
    if (
      isPublishedId(displayed?._id || '') &&
      editState?.published &&
      isPublishedPerspective(selectedPerspectiveName || '')
    ) {
      return true
    }
    return false
  }, [displayed, editState, selectedPerspectiveName])

  const isDraftSelected: boolean = useMemo(() => {
    const displayedId = displayed?._id || ''
    /** the draft is selected when:
     * not viewing a historical version,
     * when the document displayed is a draft,
     * when the perspective is null,
     * when the document is not published and the displayed version is draft,
     * when there is no draft (new document),
     */
    if (params?.historyVersion) return false
    if (isDraftId(displayedId)) return true
    if (selectedPerspectiveName) return false
    if (isVersionId(displayedId)) return false
    if (
      isPublishedId(displayedId) &&
      editState?.published &&
      isPublishedPerspective(selectedPerspectiveName || '')
    )
      return false
    return true
  }, [displayed?._id, editState, params?.historyVersion, selectedPerspectiveName])

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
        onClick={handlePerspectiveChange('published')}
        selected={isPublishSelected}
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
        selected={isDraftSelected}
        disabled={!isDraftSelected && !editState?.draft}
        text={t('release.chip.draft')}
        tone="caution"
        onClick={handlePerspectiveChange('drafts')}
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
      {filteredReleases.inCreation.map((release) => (
        <VersionChip
          key={release._id}
          tooltipContent={<TooltipContent release={release} />}
          selected
          // disabled
          onClick={() => {}}
          locked={false}
          tone={getReleaseTone(release)}
          text={release.metadata.title || t('release.placeholder-untitled-release')}
          contextValues={{
            disabled: true, // disable the chip context menu, this one is in creation
            documentId: displayed?._id || '',
            menuReleaseId: release._id,
            releases: filteredReleases.notCurrentReleases,
            releasesLoading: loading,
            documentType,
            fromRelease: getReleaseIdFromReleaseDocumentId(release._id),
            releaseState: release.state,
            isVersion: true,
          }}
        />
      ))}

      {displayed &&
        filteredReleases.currentReleases?.map((release) => (
          <VersionChip
            key={release._id}
            tooltipContent={<TooltipContent release={release} />}
            {...getReleaseChipState(release)}
            onClick={handlePerspectiveChange(getReleaseIdFromReleaseDocumentId(release._id))}
            text={release.metadata.title || t('release.placeholder-untitled-release')}
            tone={getReleaseTone(release)}
            locked={isReleaseScheduledOrScheduling(release)}
            contextValues={{
              documentId: displayed?._id || '',
              menuReleaseId: release._id,
              releases: filteredReleases.notCurrentReleases,
              releasesLoading: loading,
              documentType: documentType,
              fromRelease: getReleaseIdFromReleaseDocumentId(release._id),
              releaseState: release.state,
              isVersion: true,
            }}
          />
        ))}
    </>
  )
})
