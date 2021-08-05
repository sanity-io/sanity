import {createContext} from 'react'
import {Schema} from '@sanity/types'

export const SchemaContext = createContext<Schema | null>(null)
