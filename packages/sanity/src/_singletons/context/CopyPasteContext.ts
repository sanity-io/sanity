import {createContext} from 'react'

import type {CopyPasteContextType} from '../../core/studio/copyPaste/types'

/**
 * @beta
 * @hidden
 */
export const CopyPasteContext = createContext<CopyPasteContextType | null>(null)
