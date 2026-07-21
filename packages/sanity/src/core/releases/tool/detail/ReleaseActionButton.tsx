import {type ReleaseDocument} from '@sanity/client'

import {isReleaseScheduledOrScheduling} from '../../index'
import {ReleasePublishAllButton} from '../components/releaseCTAButtons/ReleasePublishAllButton'
import {ReleaseRevertButton} from '../components/releaseCTAButtons/ReleaseRevertButton/ReleaseRevertButton'
import {ReleaseScheduleButton} from '../components/releaseCTAButtons/ReleaseScheduleButton'
import {ReleaseUnscheduleButton} from '../components/releaseCTAButtons/ReleaseUnscheduleButton'
import {type DocumentInRelease} from './types'

/**
 * The state-driven primary release action — publish-all / schedule / unschedule / revert, depending
 * on the release's state and type. Extracted so it can render in both the footer (its original home)
 * and the top action rail; each instance manages its own local dialog state, so having two is safe.
 *
 * @internal
 */
export function ReleaseActionButton({
  release,
  documents,
}: {
  release: ReleaseDocument
  documents: DocumentInRelease[]
}): React.JSX.Element | null {
  if (release.state === 'archived') return null

  if (isReleaseScheduledOrScheduling(release)) {
    return (
      <ReleaseUnscheduleButton
        release={release}
        documents={documents}
        disabled={!documents.length}
      />
    )
  }

  if (release.state === 'active') {
    if (release.metadata.releaseType === 'scheduled') {
      return (
        <ReleaseScheduleButton
          release={release}
          documents={documents}
          disabled={!documents.length}
        />
      )
    }

    if (release.metadata.releaseType === 'asap') {
      return (
        <ReleasePublishAllButton
          release={release}
          documents={documents}
          disabled={!documents.length}
        />
      )
    }
  }

  if (release.state === 'published') {
    return (
      <ReleaseRevertButton release={release} documents={documents} disabled={!documents.length} />
    )
  }

  return null
}
