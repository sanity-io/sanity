import {type ReleaseDocument} from '@sanity/client'
import {EditIcon} from '@sanity/icons/Edit'
import {useEffect, useRef, useState} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {DetailIdentity} from '../../../components/detailLayout'
import {useTranslation} from '../../../i18n'
import {EditReleaseDialog} from '../../components/dialog/EditReleaseDialog'
import {getIsReleaseOpen} from '../../components/dialog/TitleDescriptionForm'
import {useReleaseOperations} from '../../index'
import {useReleasePermissions} from '../../store/useReleasePermissions'

/**
 * The release identity (title + description) as a read-only display surface built on the shared
 * `DetailIdentity` spine. Editing is an explicit action — a hover-revealed pencil opens the edit
 * dialog — rather than an always-live inline form, keeping the interaction consistent with how
 * documents are edited elsewhere in Studio.
 */
export function ReleaseDetailsEditor({release}: {release: ReleaseDocument}): React.JSX.Element {
  const {t} = useTranslation()
  const {updateRelease} = useReleaseOperations()
  const {checkWithPermissionGuard} = useReleasePermissions()
  const [hasUpdatePermission, setHasUpdatePermission] = useState<boolean | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const isReleaseOpen = getIsReleaseOpen(release)
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true

    if (isReleaseOpen) {
      // Editing is only possible on an open release, so only check permission when it's open.
      void checkWithPermissionGuard(updateRelease, release).then((hasPermission) => {
        if (isMounted.current) setHasUpdatePermission(hasPermission)
      })
    }

    return () => {
      isMounted.current = false
    }
  }, [checkWithPermissionGuard, isReleaseOpen, release, updateRelease])

  const canEdit = isReleaseOpen && Boolean(hasUpdatePermission)

  return (
    <>
      <DetailIdentity
        title={release.metadata.title}
        titlePlaceholder={t('release.placeholder-untitled-release')}
        description={release.metadata.description}
        titleTestId="release-title-display"
        descriptionTestId="release-description-display"
        titleAction={
          canEdit ? (
            <Button
              data-testid="edit-release-details-button"
              icon={EditIcon}
              mode="bleed"
              onClick={() => setEditOpen(true)}
              tooltipProps={{content: t('release.action.edit-details')}}
            />
          ) : undefined
        }
      />
      {editOpen && <EditReleaseDialog release={release} onClose={() => setEditOpen(false)} />}
    </>
  )
}
