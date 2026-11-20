import {type ReleaseDocument} from '@sanity/client'
import {type ReactNode} from 'react'

import {type ReleaseMetadataRecord} from '../../releases/metadata/mergeReleaseMetadata'
import {type DocumentInRelease} from '../../releases/tool/detail/types'

/**
 * @beta
 */
export interface ReleaseDetailProps {
  release: Omit<ReleaseDocument, 'metadata'> & {metadata: ReleaseMetadataRecord}
  documents: DocumentInRelease[]
}

/**
 * @beta
 */
export interface ReleaseDetailComponent {
  (props: ReleaseDetailProps): ReactNode
}
