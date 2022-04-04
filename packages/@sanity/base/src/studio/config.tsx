import React, {createContext, useContext} from 'react'
import {SanityConfig} from '../config'

interface ConfigProviderProps {
  config: SanityConfig
  children?: React.ReactChild
}
const ConfigContext = createContext<SanityConfig | null>(null)
export function ConfigProvider({children, config}: ConfigProviderProps) {
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
}
export function useConfig() {
  const config = useContext(ConfigContext)
  if (!config) throw new Error('Could not find `config` context')
  return config
}
