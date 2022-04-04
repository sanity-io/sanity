import React, {createContext, useContext} from 'react'
import {Config} from '../config'

interface ConfigProviderProps {
  config: Config
  children?: React.ReactChild
}
const ConfigContext = createContext<Config | null>(null)
export function ConfigProvider({children, config}: ConfigProviderProps) {
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
}
export function useConfig() {
  const config = useContext(ConfigContext)
  if (!config) throw new Error('Could not find `config` context')
  return config
}
