import {useMemo} from 'react'
import {EnhancedObjectDialogContext} from 'sanity/_singletons'

import {useSource} from '../../../../../studio/source'
import {type EnhancedObjectDialogContextValue} from './useEnhancedObjectDialog'

interface EnhancedObjectDialogProviderProps {
  children: React.ReactNode
  /**
   * A boolean indicating whether legacy editing is enabled - meaning that it will use the old modal based editing experience
   */
  legacyEditing?: boolean
}

/**
 * @deprecated This provider is no longer used and will be removed in a future release as we make the enhanced object dialog the default.
 */
export function EnhancedObjectDialogProvider(
  props: EnhancedObjectDialogProviderProps,
): React.JSX.Element {
  const {children, legacyEditing} = props
  const {beta} = useSource()

  const value = useMemo((): EnhancedObjectDialogContextValue => {
    return {
      enabled: true,
      legacyEditing: Boolean(legacyEditing),
    }
  }, [legacyEditing])

  return (
    <EnhancedObjectDialogContext.Provider value={value}>
      {children}
    </EnhancedObjectDialogContext.Provider>
  )
}
