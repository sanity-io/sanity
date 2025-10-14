import {Text} from '@sanity/ui'
import {memo, useCallback, useMemo} from 'react'
import {
  formatRelativeLocalePublishDate,
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  getVersionFromId,
  isCardinalityOneRelease,
  isDraftId,
  isGoingToUnpublish,
  isPublishedId,
  isPublishedPerspective,
  isReleaseDocument,
  isReleaseScheduledOrScheduling,
  isVersionId,
  type ReleaseDocument,
  type SanityDocumentLike,
  Translate,
  useActiveReleases,
  useDateTimeFormat,
  type UseDateTimeFormatOptions,
  useFilteredReleases,
  useGetDefaultPerspective,
  useOnlyHasVersions,
  usePerspective,
  useSchema,
  useSetPerspective,
  useSingleDocRelease,
  useTranslation,
  useWorkspace,
  VersionChip,
} from 'sanity'

import {isLiveEditEnabled} from '../../../../../components/paneItem/helpers'
import {usePaneRouter} from '../../../../../components/paneRouter/usePaneRouter'
import {useDocumentPane} from '../../../useDocumentPane'

const TooltipContent = ({release}: {release: ReleaseDocument}) => {
  const {t} = useTranslation()

  if (release.state === 'archived') {
    return <Text size={1}>{t('release.chip.tooltip.archived')}</Text>
  }
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

const DATE_TIME_FORMAT: UseDateTimeFormatOptions = {
  dateStyle: 'medium',
  timeStyle: 'short',
}

// eslint-disable-next-line complexity
export const DocumentPerspectiveList = memo(function DocumentPerspectiveList() {
  const {selectedReleaseId, selectedPerspectiveName} = usePerspective()
  const {t} = useTranslation()
  const setPerspective = useSetPerspective()
  const {params, setParams} = usePaneRouter()
  const dateTimeFormat = useDateTimeFormat(DATE_TIME_FORMAT)
  const {loading} = useActiveReleases()
  const schema = useSchema()
  const {editState, displayed, documentType, documentId} = useDocumentPane()
  const isCreatingDocument = displayed && !displayed._createdAt
  const defaultPerspective = useGetDefaultPerspective()
  const filteredReleases = useFilteredReleases({
    historyVersion: params?.historyVersion,
    displayed,
    documentId,
  })

  const onlyHasVersions = useOnlyHasVersions({documentId})
  const workspace = useWorkspace()
  const {onSetScheduledDraftPerspective} = useSingleDocRelease()

  const handleCopyToDraftsNavigate = useCallback(() => {
    // after copying to draft, we want to navigate to the draft version
    if (params?.scheduledDraft) {
      // if currently viewing a scheduled draft, remove the scheduled draft perspective
      // the global perspective is already set to drafts
      onSetScheduledDraftPerspective('')
    } else {
      // otherwise, only need to set the global perspective to drafts
      setPerspective('drafts')
    }
  }, [params, setPerspective, onSetScheduledDraftPerspective])

  const handlePerspectiveChange = useCallback(
    (perspective: 'published' | 'drafts' | ReleaseDocument) => () => {
      if (isReleaseDocument(perspective) && isCardinalityOneRelease(perspective)) {
        onSetScheduledDraftPerspective(getReleaseIdFromReleaseDocumentId(perspective._id))
        return
      }

      if (perspective === 'published' && params?.historyVersion) {
        setParams({
          ...params,
          rev: params?.historyEvent || undefined,
          since: undefined,
          historyVersion: undefined,
        })
      }
      const newPerspective = isReleaseDocument(perspective)
        ? getReleaseIdFromReleaseDocumentId(perspective._id)
        : perspective === defaultPerspective
          ? ''
          : perspective

      if (params?.scheduledDraft) {
        setParams(
          {...params, scheduledDraft: undefined},
          // If we have a scheduled draft perspective, then we need to remove that one and set the new perspective.
          // We cannot do it in two passes, for example first set the paneParam and the use the `setPerspective`
          // because we will have a race condition in where the last state wins, but the last state won't have the previous change.
          // So we change the params and perspective in the same call.
          {perspective: newPerspective},
        )
      } else {
        setPerspective(newPerspective)
      }
    },
    [setPerspective, setParams, params, defaultPerspective, onSetScheduledDraftPerspective],
  )

  const schemaType = schema.get(documentType)
  const isLiveEdit = schemaType ? isLiveEditEnabled(schemaType) : false

  const isPublishedChipDisabled = useMemo(() => {
    // If it's a live edit document the only option to edit it is through
    // the published perspective, users should be able to select it.
    if (isLiveEdit && !selectedReleaseId) return false

    // If it's not live edit, we want to check for the existence of the published doc.
    return !editState?.published
  }, [isLiveEdit, selectedReleaseId, editState?.published])

  const getReleaseChipState = (
    release: ReleaseDocument,
  ): {selected: boolean; disabled?: boolean} => {
    if (!params?.historyVersion) {
      const isCurrentVersionGoingToUnpublish =
        editState?.version &&
        isGoingToUnpublish(editState?.version) &&
        getReleaseIdFromReleaseDocumentId(release._id) === getVersionFromId(editState?.version?._id)

      return {
        selected: Boolean(
          getReleaseIdFromReleaseDocumentId(release._id) ===
            getVersionFromId(displayed?._id || '') || isCurrentVersionGoingToUnpublish,
        ),
      }
    }

    const isReleaseHistoryMatch =
      getReleaseIdFromReleaseDocumentId(release._id) === params.historyVersion

    return {selected: isReleaseHistoryMatch, disabled: isReleaseHistoryMatch}
  }

  const isPublishSelected: boolean = useMemo(() => {
    /**
     * The publish perspective is selected when:
     *  - the document is live edit and there is no draft
     *  - the document is published and the selected perspective is published
     */
    if (isLiveEdit && !editState?.draft?._id && !selectedReleaseId) return true
    if (
      isPublishedId(displayed?._id || '') &&
      isPublishedPerspective(selectedPerspectiveName || '')
    ) {
      return true
    }
    return false
  }, [
    displayed?._id,
    editState?.draft?._id,
    isLiveEdit,
    selectedPerspectiveName,
    selectedReleaseId,
  ])

  const isDraftSelected: boolean = useMemo(() => {
    const displayedId = displayed?._id || ''
    /** the draft is selected when:
     * not viewing a historical version,
     * when the document displayed is a draft,
     * when the perspective is null,
     * when the document is not published and the displayed version is draft,
     * when there is no draft (new document),
     */
    if (isPublishSelected) return false
    if (params?.historyVersion) return false
    if (selectedPerspectiveName) return false
    if (isVersionId(displayedId)) return false
    if (isDraftId(displayedId)) return true
    if (
      isPublishedId(displayedId) &&
      editState?.published &&
      isPublishedPerspective(selectedPerspectiveName || '')
    )
      return false
    return true
  }, [
    displayed?._id,
    editState?.published,
    isPublishSelected,
    params?.historyVersion,
    selectedPerspectiveName,
  ])

  const isDraftDisabled: boolean = useMemo(() => {
    // Draft is disabled when the document has no published or draft but has versions
    if (onlyHasVersions || (isCreatingDocument && selectedReleaseId)) {
      return true
    }

    // Draft is disabled when we are creating a new document inside a release
    // or when the document is live edit and there is no draft
    if (!editState?.draft && !isLiveEdit) {
      return false
    }

    if (isCreatingDocument && selectedReleaseId) return true
    if (isLiveEdit) return true
    return false
  }, [editState?.draft, isCreatingDocument, isLiveEdit, onlyHasVersions, selectedReleaseId])

  const isDraftModelEnabled = workspace.document.drafts?.enabled

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
        onCopyToDraftsNavigate={handleCopyToDraftsNavigate}
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
      {isDraftModelEnabled && (
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
                <>
                  {isLiveEdit
                    ? t('release.chip.tooltip.draft-disabled.live-edit')
                    : t('release.chip.tooltip.no-edits')}
                </>
              )}
            </Text>
          }
          selected={isDraftSelected}
          disabled={isDraftDisabled}
          text={t('release.chip.draft')}
          tone={editState?.draft ? 'caution' : 'neutral'}
          onClick={handlePerspectiveChange('drafts')}
          onCopyToDraftsNavigate={handleCopyToDraftsNavigate}
          contextValues={{
            documentId: editState?.draft?._id || editState?.published?._id || editState?.id || '',
            menuReleaseId:
              editState?.draft?._id || editState?.published?._id || editState?.id || '',
            releases: filteredReleases.notCurrentReleases,
            releasesLoading: loading,
            documentType: documentType,
            fromRelease: 'draft',
            isVersion: false,
          }}
        />
      )}
      {filteredReleases.inCreation && (
        <VersionChip
          tooltipContent={<TooltipContent release={filteredReleases.inCreation} />}
          selected
          onClick={() => {}}
          locked={false}
          tone={getReleaseTone(filteredReleases.inCreation)}
          text={
            filteredReleases.inCreation.metadata.title || t('release.placeholder-untitled-release')
          }
          onCopyToDraftsNavigate={handleCopyToDraftsNavigate}
          contextValues={{
            disabled: true, // disable the chip context menu, this one is in creation
            documentId: displayed?._id || '',
            menuReleaseId: filteredReleases.inCreation._id,
            releases: filteredReleases.notCurrentReleases,
            releasesLoading: loading,
            documentType,
            fromRelease: getReleaseIdFromReleaseDocumentId(filteredReleases.inCreation._id),
            releaseState: filteredReleases.inCreation.state,
            isVersion: true,
            release: filteredReleases.inCreation,
          }}
        />
      )}

      {displayed &&
        filteredReleases.currentReleases?.map((release) => (
          <VersionChip
            key={release._id}
            tooltipContent={<TooltipContent release={release} />}
            {...getReleaseChipState(release)}
            onClick={handlePerspectiveChange(release)}
            text={release.metadata.title || t('release.placeholder-untitled-release')}
            tone={getReleaseTone(release)}
            locked={isReleaseScheduledOrScheduling(release)}
            onCopyToDraftsNavigate={handleCopyToDraftsNavigate}
            contextValues={{
              documentId: displayed?._id || '',
              menuReleaseId: release._id,
              releases: filteredReleases.notCurrentReleases,
              releasesLoading: loading,
              documentType: documentType,
              fromRelease: getReleaseIdFromReleaseDocumentId(release._id),
              releaseState: release.state,
              isVersion: true,
              // displayed, in this instance is not going to be the version to compare to
              // since it's going to be the published version
              isGoingToUnpublish: editState?.version
                ? isGoingToUnpublish(editState?.version as SanityDocumentLike)
                : false,
              release,
            }}
          />
        ))}
    </>
  )
})
