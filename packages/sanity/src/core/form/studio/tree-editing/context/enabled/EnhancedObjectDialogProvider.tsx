import {useSource} from '../../../../../studio/source'
import {type EnhancedObjectDialogContextValue} from './useEnhancedObjectDialog'
import {useMemo} from 'react'
import {EnhancedObjectDialogContext} from 'sanity/_singletons'

interface EnhancedObjectDialogProviderProps {
  children: React.ReactNode
  /**
   * A boolean indicating whether legacy editing is enabled - meaning that it will use the old modal based editing experience
   */
  legacyEditing?: boolean
}

export function EnhancedObjectDialogProvider(
  props: EnhancedObjectDialogProviderProps,
): React.JSX.Element {
  const {children, legacyEditing} = props
  const {beta} = useSource()

  const value = useMemo((): EnhancedObjectDialogContextValue => {
    return {
      enabled: beta?.form?.enhancedObjectDialog?.enabled === true,
      legacyEditing: Boolean(legacyEditing),
    }
  }, [beta?.form?.enhancedObjectDialog?.enabled, legacyEditing])

  return (
    <EnhancedObjectDialogContext.Provider value={value}>
      {children}
    </EnhancedObjectDialogContext.Provider>
  )
}
