import {ArchiveIcon, CloseCircleIcon, TrashIcon, UnarchiveIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {
  type Dispatch,
  type MouseEventHandler,
  type SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react'
import {useRouter} from 'sanity/router'

import {MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {useBundleDocuments} from '../../detail/useBundleDocuments'
import {type ReleaseAction} from './releaseActions'
import {type ReleaseMenuButtonProps} from './ReleaseMenuButton'

export type ReleaseMenuProps = ReleaseMenuButtonProps & {
  setSelectedAction: Dispatch<SetStateAction<ReleaseAction | undefined>>
  setReleaseDocumentsCount: Dispatch<SetStateAction<number | undefined>>
}

export const ReleaseMenu = ({
  ignoreCTA,
  release,
  setSelectedAction,
  setReleaseDocumentsCount,
}: ReleaseMenuProps) => {
  const toast = useToast()
  const router = useRouter()
  const {archive, unarchive, deleteRelease, unschedule} = useReleaseOperations()
  const {loading: isLoadingReleaseDocuments, results: releaseDocuments} = useBundleDocuments(
    getReleaseIdFromReleaseDocumentId(release._id),
  )
  const [isPerformingOperation, setIsPerformingOperation] = useState(false)

  const releaseMenuDisabled = !release || isLoadingReleaseDocuments
  const {t} = useTranslation(releasesLocaleNamespace)

  const handleOnInitiateAction = useCallback<MouseEventHandler<HTMLDivElement>>(
    (event) => {
      const action = event.currentTarget.getAttribute('data-value') as ReleaseAction

      setSelectedAction(action)
      setReleaseDocumentsCount(releaseDocuments.length)
    },
    [releaseDocuments.length, setReleaseDocumentsCount, setSelectedAction],
  )

  const archiveUnarchiveMenuItem = useMemo(() => {
    if (release.state === 'published') return null

    if (release.state === 'archived')
      return (
        <MenuItem
          data-value="unarchive"
          onClick={handleOnInitiateAction}
          icon={UnarchiveIcon}
          text={t('action.unarchive')}
          data-testid="unarchive-release-menu-item"
        />
      )

    return (
      <MenuItem
        tooltipProps={{
          disabled: !['scheduled', 'scheduling'].includes(release.state) || isPerformingOperation,
          content: t('action.archive.tooltip'),
        }}
        data-value="archive"
        onClick={handleOnInitiateAction}
        icon={ArchiveIcon}
        text={t('action.archive')}
        data-testid="archive-release-menu-item"
        disabled={['scheduled', 'scheduling'].includes(release.state)}
      />
    )
  }, [handleOnInitiateAction, isPerformingOperation, release.state, t])

  const deleteMenuItem = useMemo(() => {
    if (release.state !== 'archived' && release.state !== 'published') return null

    return (
      <MenuItem
        data-value="delete"
        onClick={handleOnInitiateAction}
        disabled={releaseMenuDisabled || isPerformingOperation}
        icon={TrashIcon}
        text={t('action.delete-release')}
        data-testid="delete-release-menu-item"
      />
    )
  }, [handleOnInitiateAction, isPerformingOperation, release.state, releaseMenuDisabled, t])

  const unscheduleMenuItem = useMemo(() => {
    if (ignoreCTA || (release.state !== 'scheduled' && release.state !== 'scheduling')) return null

    return (
      <MenuItem
        data-value="unschedule"
        onClick={handleOnInitiateAction}
        disabled={releaseMenuDisabled || isPerformingOperation}
        icon={CloseCircleIcon}
        text={t('action.unschedule')}
        data-testid="unschedule-release-menu-item"
      />
    )
  }, [
    handleOnInitiateAction,
    ignoreCTA,
    isPerformingOperation,
    release.state,
    releaseMenuDisabled,
    t,
  ])

  return (
    <>
      {unscheduleMenuItem}
      {archiveUnarchiveMenuItem}
      {deleteMenuItem}
    </>
  )
}
