import {useContext} from 'react'
import {ConfigContext} from './ConfigContext'
import {SanityConfig} from './types'

export function useConfig(): SanityConfig {
  const config = useContext(ConfigContext)

  if (!config) {
    throw new Error('Config: missing context value')
  }

  return config
}
