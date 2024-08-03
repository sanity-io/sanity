import {createContext} from 'react'

import type {DocumentChangeContextInstance} from '../../../../core/field/diff/contexts/DocumentChangeContext'

/** @internal */
export const DocumentChangeContext = createContext<DocumentChangeContextInstance | null>(null)
