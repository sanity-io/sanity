import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {ReleasesMetadataContextValue} from '../../core/releases/contexts/ReleasesMetadataProvider'

/**
 * @internal
 * @hidden
 */
export const ReleasesMetadataContext: Context<ReleasesMetadataContextValue | null> =
  createContext<ReleasesMetadataContextValue | null>(
    'sanity/_singletons/context/releases-metadata',
    null,
  )
