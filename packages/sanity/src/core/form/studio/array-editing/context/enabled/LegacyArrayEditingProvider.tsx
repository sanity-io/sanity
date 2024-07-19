import {useMemo} from 'react'
import {useSource} from 'sanity'
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

  // TODO: tree editing is not a concept anymore, and this config property
  // should either be removed or renamed.
  const treeEditingEnabled = useSource().beta?.treeArrayEditing?.enabled
  const parentContextValue = useLegacyArrayEditing()

  const value = useMemo((): LegacyArrayEditingContextValue => {
    return {
      // If a parent context has enabled legacy array editing, we should
      // forward that value. If not, we should use the prop value.
      enabled: Boolean(!treeEditingEnabled || parentContextValue.enabled || enabledProp),
    }
  }, [enabledProp, parentContextValue.enabled, treeEditingEnabled])

  return (
    <LegacyArrayEditingContext.Provider value={value}>
      {children}
    </LegacyArrayEditingContext.Provider>
  )
}
