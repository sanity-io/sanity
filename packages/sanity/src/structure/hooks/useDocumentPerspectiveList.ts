import {useCallback, useMemo} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getVersionFromId,
  isDraftId,
  isGoingToUnpublish,
  isPublishedId,
  isPublishedPerspective,
  isVersionId,
  type ReleaseDocument,
  type TargetPerspective,
  useAgentVersionDisplay,
  useDocumentVersions,
  useFilteredReleases,
  usePerspective,
  useSchema,
  useSetPerspective,
  useSingleDocRelease,
  useWorkspace,
} from 'sanity'

import {isLiveEditEnabled} from '../components/paneItem/helpers'
import {usePaneRouter} from '../components/paneRouter/usePaneRouter'
import {useDocumentPane} from '../panes/document/useDocumentPane'
import {useDocumentPaneInfo} from '../panes/document/useDocumentPaneInfo'
import {usePerspectiveNavigator} from './usePerspectiveNavigator'

interface DocumentPerspectiveList {
  /** Releases relevant to the displayed document, grouped by relevance. */
  filteredReleases: ReturnType<typeof useFilteredReleases>
  /**
   * Returns display overrides for a version document ID if it's the current
   * user's agent bundle, or `null` for all other versions.
   */
  getVersionDisplay: ReturnType<typeof useAgentVersionDisplay>['getVersionDisplay']
  /** Returns the chip selection/disabled state for a given release. */
  getReleaseChipState: (release: ReleaseDocument) => {selected: boolean; disabled?: boolean}
  /** Navigates to the draft perspective after copying a version to drafts. */
  handleCopyToDraftsNavigate: () => void
  /** Navigates to the given perspective. */
  handlePerspectiveChange: (perspective: TargetPerspective) => void
  isDraftDisabled: boolean
  isDraftModelEnabled: boolean | undefined
  isDraftSelected: boolean
  isLiveEdit: boolean
  isPublishedChipDisabled: boolean
  isPublishSelected: boolean
  /** Version document IDs that don't belong to a release (excluding drafts and published). */
  nonReleaseVersions: string[]
}

/**
 * Derives the state needed to render the list of perspectives (published,
 * draft, releases and other versions) for the document in the current pane:
 * chip selection/disabled states and navigation handlers.
 *
 * Must be used within a document pane, as it relies on `useDocumentPane` and
 * `usePaneRouter`.
 *
 * @internal
 */
export function useDocumentPerspectiveList(): DocumentPerspectiveList {
  const {selectedReleaseId, selectedPerspectiveName} = usePerspective()
  const setPerspective = useSetPerspective()
  const {params} = usePaneRouter()
  const schema = useSchema()
  const {editState, displayed} = useDocumentPane()
  const {documentType, documentId} = useDocumentPaneInfo()
  const isCreatingDocument = displayed && !displayed._createdAt
  const filteredReleases = useFilteredReleases({
    historyVersion: params?.historyVersion,
    displayed,
    documentId,
  })

  const {data: documentVersions} = useDocumentVersions({documentId})

  const onlyHasVersions =
    documentVersions &&
    documentVersions.length > 0 &&
    !documentVersions.some((version) => !isVersionId(version))

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

  const {navigate: handlePerspectiveChange} = usePerspectiveNavigator()

  const schemaType = schema.get(documentType)
  const isLiveEdit = schemaType ? isLiveEditEnabled(schemaType) : false

  const isPublishedChipDisabled = useMemo(() => {
    // If it's a live edit document the only option to edit it is through
    // the published perspective, users should be able to select it.
    if (isLiveEdit && !selectedReleaseId) return false

    // If it's not live edit, we want to check for the existence of the published doc.
    return !editState?.published
  }, [isLiveEdit, selectedReleaseId, editState?.published])

  const getReleaseChipState = useCallback(
    (release: ReleaseDocument): {selected: boolean; disabled?: boolean} => {
      if (!params?.historyVersion) {
        const isCurrentVersionGoingToUnpublish =
          editState?.version &&
          isGoingToUnpublish(editState?.version) &&
          getReleaseIdFromReleaseDocumentId(release._id) ===
            getVersionFromId(editState?.version?._id)

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
    },
    [params, editState?.version, displayed?._id],
  )

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

  const {filteredVersionIds, getVersionDisplay} = useAgentVersionDisplay(
    documentVersions,
    selectedPerspectiveName,
  )

  const nonReleaseVersions = useMemo(
    () =>
      filteredVersionIds.filter((versionDocumentId) => {
        if (isPublishedId(versionDocumentId) || isDraftId(versionDocumentId)) {
          return false
        }
        const hasRelease = filteredReleases.currentReleases.some((release) => {
          return (
            getReleaseIdFromReleaseDocumentId(release._id) === getVersionFromId(versionDocumentId)
          )
        })
        return !hasRelease
      }),
    [filteredVersionIds, filteredReleases.currentReleases],
  )

  return {
    filteredReleases,
    getVersionDisplay,
    getReleaseChipState,
    handleCopyToDraftsNavigate,
    handlePerspectiveChange,
    isDraftDisabled,
    isDraftModelEnabled,
    isDraftSelected,
    isLiveEdit,
    isPublishedChipDisabled,
    isPublishSelected,
    nonReleaseVersions,
  }
}
