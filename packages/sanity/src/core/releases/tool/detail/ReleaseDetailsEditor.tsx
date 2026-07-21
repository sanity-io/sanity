import {type ReleaseDocument} from '@sanity/client'
import {EditIcon} from '@sanity/icons/Edit'
import {useState} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {DetailIdentity} from '../../../components/detailLayout'
import {useTranslation} from '../../../i18n'
import {useWorkspace} from '../../../studio/workspace'
import {EditReleaseDialog} from '../../components/dialog/EditReleaseDialog'
import {useCanEditRelease} from './useCanEditRelease'

/**
 * The release identity (title + description) as a read-only display surface built on the shared
 * `DetailIdentity` spine.
 *
 * Editing is an explicit action, never inline. In production it is a hover-revealed pencil beside
 * the title; behind `beta.variants` the pencil is dropped in favour of a defined "Edit details"
 * action in the top action rail (a defined button is discoverable and keyboard/screen-reader
 * accessible in a way a hover-only affordance is not).
 */
export function ReleaseDetailsEditor({release}: {release: ReleaseDocument}): React.JSX.Element {
  const {t} = useTranslation()
  const [editOpen, setEditOpen] = useState(false)
  const canEdit = useCanEditRelease(release)

  // Behind beta.variants, editing lives in the action rail, so the identity block is pure display.
  const variantsEnabled = Boolean(useWorkspace().beta?.variants?.enabled)
  const showInlineEdit = canEdit && !variantsEnabled

  return (
    <>
      <DetailIdentity
        title={release.metadata.title}
        titlePlaceholder={t('release.placeholder-untitled-release')}
        description={release.metadata.description}
        titleTestId="release-title-display"
        descriptionTestId="release-description-display"
        titleAction={
          showInlineEdit ? (
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
