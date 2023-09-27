import {SanityDocumentLike} from '@sanity/types'
import {createContext} from 'react'

export const InitialValueContext = createContext<SanityDocumentLike | null>(null)
