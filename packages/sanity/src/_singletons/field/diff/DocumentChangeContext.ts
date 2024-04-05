import {createContext} from 'react'
import type {DocumentChangeContextInstance} from 'sanity'

/** @internal */
export const DocumentChangeContext = createContext<DocumentChangeContextInstance | null>(null)
