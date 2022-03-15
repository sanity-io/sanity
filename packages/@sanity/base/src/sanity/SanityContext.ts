import {createContext} from 'react'
import {SanityProjectConfig} from '../studio'
import {SanityAuthConfig, SanityFormBuilderConfig} from '../config'
import {SanitySource} from '../source'

export interface SanityContextValue {
  auth: SanityAuthConfig
  formBuilder: SanityFormBuilderConfig
  project: SanityProjectConfig
  schemaTypes: any[]
  sources: SanitySource[]
}

export const SanityContext = createContext<SanityContextValue | null>(null)
