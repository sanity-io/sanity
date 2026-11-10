import {createContext} from 'react'

import type {ReleasesMetadataContextValue} from '../../core/releases/contexts/ReleasesMetadataProvider'

/**
 * @internal
 * @hidden
 */
export const ReleasesMetadataContext = createContext<ReleasesMetadataContextValue | null>(null)
