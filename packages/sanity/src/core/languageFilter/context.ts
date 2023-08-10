import {createContext} from 'react'
import type {DocumentLanguageFilterComponent} from '../config'

/**
 * @internal
 */
export const LanguageFilterContext = createContext<DocumentLanguageFilterComponent[]>([])
