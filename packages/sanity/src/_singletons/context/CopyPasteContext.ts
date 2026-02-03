import type {CopyPasteContextType} from '../../core/studio/copyPaste'
import {createContext} from 'sanity/_createContext'

/**
 * @beta
 * @hidden
 */
export const CopyPasteContext = createContext<CopyPasteContextType | null>(
  'sanity/_singletons/context/copy-paste',
  null,
)
