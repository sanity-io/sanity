import {type ReleaseDocument} from '@sanity/client'
import {useMemo} from 'react'

import {type ReleaseActionComponent} from '../../config/releases/actions'
import {useSource} from '../../studio'
import {type DocumentInRelease} from '../tool/detail/useBundleDocuments'

/**
 * Hook to get custom/configured release actions for a release
 *
 * @internal
 */
export function useCustomReleaseActions(
  release: ReleaseDocument,
  documents: DocumentInRelease[] = [],
): ReleaseActionComponent[] {
  const source = useSource()

  const customReleaseActions = useMemo(() => {
    if (!source.releases?.actions) {
      return []
    }

    return source.releases.actions({
      release,
      documents,
    })
  }, [source, release, documents])

  return customReleaseActions
}
