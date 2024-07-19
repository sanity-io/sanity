import {useMemo} from 'react'
import {LegacyArrayEditingContext} from 'sanity/_singletons'

import {type LegacyArrayEditingContextValue, useLegacyArrayEditing} from './useLegacyArrayEditing'

interface LegacyArrayEditingProviderProps {
  children: React.ReactNode
  enabled?: boolean
}

/**
 * A provider that enables legacy array editing for its children.
 * @internal
 */
export function LegacyArrayEditingProvider(props: LegacyArrayEditingProviderProps): JSX.Element {
  const {children, enabled: enabledProp} = props

  const parentContextValue = useLegacyArrayEditing()

  const value = useMemo((): LegacyArrayEditingContextValue => {
    return {
      // If a parent context has enabled legacy array editing, we should
      // forward that value. If not, we should use the prop value.
      enabled: Boolean(parentContextValue.enabled || enabledProp),
    }
  }, [enabledProp, parentContextValue.enabled])

  return (
    <LegacyArrayEditingContext.Provider value={value}>
      {children}
    </LegacyArrayEditingContext.Provider>
  )
}
