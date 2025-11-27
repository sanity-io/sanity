import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {CopyPasteContextType} from '../../core/studio/copyPaste'

/**
 * @beta
 * @hidden
 */
export const CopyPasteContext: Context<CopyPasteContextType | null> =
  createContext<CopyPasteContextType | null>('sanity/_singletons/context/copy-paste', null)
