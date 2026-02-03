import {createContext} from 'sanity/_createContext'

import type {CopyPasteContextType} from '../../core/studio/copyPaste'

/**
 * @beta
 * @hidden
 */
export const CopyPasteContext = createContext<CopyPasteContextType | null>(
  'sanity/_singletons/context/copy-paste',
  null,
)
