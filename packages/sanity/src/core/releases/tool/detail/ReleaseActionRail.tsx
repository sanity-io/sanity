import {type ReleaseDocument} from '@sanity/client'
import {useState} from 'react'

import {DetailActionRail} from '../../../components/detailLayout'
import {EditReleaseDialog} from '../../components/dialog/EditReleaseDialog'
import {ReleaseMenuButton} from '../components/ReleaseMenuButton/ReleaseMenuButton'
import {ReleaseActionButton} from './ReleaseActionButton'
import {type DocumentInRelease} from './types'
import {useCanEditRelease} from './useCanEditRelease'

/**
 * The Releases top action rail (behind `beta.variants`): the state-driven primary — Run release /
 * Publish / Schedule / Unschedule / Revert — followed by the overflow `⋯` menu. "Edit details" is
 * routed through the overflow rather than an inline pencil, so editing is one defined, discoverable,
 * keyboard-accessible action. Replaces the bottom footer's action cluster, which is dropped in beta.
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
  const [editOpen, setEditOpen] = useState(false)
  const canEdit = useCanEditRelease(release)

  return (
    <>
      <DetailActionRail
        primary={<ReleaseActionButton release={release} documents={documents} />}
        menu={
          <ReleaseMenuButton
            release={release}
            documentsCount={documents.length}
            documents={documents}
            ignoreCTA={release.metadata.releaseType !== 'undecided'}
            onEditDetails={canEdit ? () => setEditOpen(true) : undefined}
          />
        }
      />
      {editOpen && <EditReleaseDialog release={release} onClose={() => setEditOpen(false)} />}
    </>
  )
}
