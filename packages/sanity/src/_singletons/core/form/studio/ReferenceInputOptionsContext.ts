import {createContext} from 'react'

import type {ReferenceInputOptions} from '../../../../core/form/studio/contexts/ReferenceInputOptions'

/**
 * @internal
 */
export const ReferenceInputOptionsContext = createContext<ReferenceInputOptions>({})
