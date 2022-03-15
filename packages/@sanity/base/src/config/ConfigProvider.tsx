import React from 'react'
import {SanityConfig} from './types'
import {ConfigContext} from './ConfigContext'

export function ConfigProvider(props: {children?: React.ReactNode; config: SanityConfig}) {
  const {children, config} = props

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
}
