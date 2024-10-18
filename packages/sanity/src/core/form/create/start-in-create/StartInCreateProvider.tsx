import {useMemo} from 'react'

import {StartInCreateContext} from '../../../../_singletons/context/StartInCreateContext'
import {useSource} from '../../../studio'
import {type StartInCreateEnabledContextValue} from './useStartInCreateEnabled'

interface StartInCreateProviderProps {
  children: React.ReactNode
}

export function StartInCreateProvider(props: StartInCreateProviderProps): JSX.Element {
  const {children} = props
  const {beta} = useSource()
  const value = useMemo((): StartInCreateEnabledContextValue => {
    return {
      enabled: !!beta?.create?.startInCreateEnabled,
    }
  }, [beta?.create])

  return <StartInCreateContext.Provider value={value}>{children}</StartInCreateContext.Provider>
}
