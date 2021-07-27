import {createContext} from 'react'
import {SanityDocument} from '@sanity/types'

export const DocumentContext = createContext<SanityDocument | null>(null)
