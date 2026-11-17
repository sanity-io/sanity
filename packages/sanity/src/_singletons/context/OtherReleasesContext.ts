import type {ReleaseDocument} from '@sanity/client'
import {createContext} from 'react'

/**
 * The other active releases a document group is in, for the release page being shown.
 *
 * @internal
 * @hidden
 */
export const OtherReleasesContext = createContext<((groupId: string) => ReleaseDocument[]) | null>(
  null,
)
