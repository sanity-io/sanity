import {type ReleaseDocument} from '@sanity/client'
import {EditIcon} from '@sanity/icons/Edit'
import {useState} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {DetailActionRail} from '../../../components/detailLayout'
import {useTranslation} from '../../../i18n'
import {EditReleaseDialog} from '../../components/dialog/EditReleaseDialog'
import {ReleaseMenuButton} from '../components/ReleaseMenuButton/ReleaseMenuButton'
import {ReleaseActionButton} from './ReleaseActionButton'
import {type DocumentInRelease} from './types'
import {useCanEditRelease} from './useCanEditRelease'

/**
 * The Releases top action rail (behind `beta.variants`): an icon-only "Edit details" secondary, the
 * state-driven primary — Run release / Publish / Schedule / Unschedule / Revert — and the overflow
 * `⋯` menu. Edit details is a defined, always-visible affordance (not an inline hover pencil, not
 * buried in the overflow), which is more discoverable and keyboard-accessible, and mirrors the
 * Variant-definition detail page's top-of-page edit. Replaces the bottom footer's action cluster,
 * which is dropped in beta.
 *
 * @internal
 */
export function ReleaseActionRail({
  release,
  documents,
}: {
  release: ReleaseDocument
  documents: DocumentInRelease[]
}): React.JSX.Element {
  const {t} = useTranslation()
  const [editOpen, setEditOpen] = useState(false)
  const canEdit = useCanEditRelease(release)

  return (
    <>
      <DetailActionRail
        secondary={
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
        primary={<ReleaseActionButton release={release} documents={documents} />}
        menu={
          <ReleaseMenuButton
            release={release}
            documentsCount={documents.length}
            documents={documents}
            ignoreCTA={release.metadata.releaseType !== 'undecided'}
          />
        }
      />
      {editOpen && <EditReleaseDialog release={release} onClose={() => setEditOpen(false)} />}
    </>
  )
}
