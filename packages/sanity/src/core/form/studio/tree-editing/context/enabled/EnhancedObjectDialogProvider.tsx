import {useMemo} from 'react'
import {EnhancedObjectDialogContext} from 'sanity/_singletons'

import {useSource} from '../../../../../studio/source'
import {type EnhancedObjectDialogContextValue} from './useEnhancedObjectDialog'

interface EnhancedObjectDialogProviderProps {
  children: React.ReactNode
  /**
   * A boolean indicating whether the EnhancedObjectDialog component is rendered and available in this tree
   */
  isDialogAvailable?: boolean
  /**
   * A boolean indicating whether legacy editing is enabled - meaning that it will use the old modal based editing experience
   */
  legacyEditing?: boolean
}

export function EnhancedObjectDialogProvider(
  props: EnhancedObjectDialogProviderProps,
): React.JSX.Element {
  const {children, isDialogAvailable, legacyEditing} = props
  const {beta} = useSource()

  const value = useMemo((): EnhancedObjectDialogContextValue => {
    return {
      enabled: beta?.form?.enhancedObjectDialog?.enabled === true,
      isDialogAvailable: Boolean(isDialogAvailable),
      legacyEditing: Boolean(legacyEditing),
    }
  }, [beta?.form?.enhancedObjectDialog?.enabled, isDialogAvailable, legacyEditing])

  return (
    <EnhancedObjectDialogContext.Provider value={value}>
      {children}
    </EnhancedObjectDialogContext.Provider>
  )
}
