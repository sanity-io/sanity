import {useMemo} from 'react'
import {NestedObjectDialogContext} from 'sanity/_singletons'

import {useSource} from '../../../../../studio/source'
import {type NestedObjectDialogContextValue} from './useNestedObjectDialog'

interface NestedObjectDialogProviderProps {
  children: React.ReactNode
  /**
   * A boolean indicating whether legacy editing is enabled - meaning that it will use the old modal based editing experience
   */
  legacyEditing?: boolean
}

export function NestedObjectDialogProvider(
  props: NestedObjectDialogProviderProps,
): React.JSX.Element {
  const {children, legacyEditing} = props
  const {beta} = useSource()

  const value = useMemo((): NestedObjectDialogContextValue => {
    return {
      enabled: beta?.form?.enhancedObjectDialog?.enabled === true,
      legacyEditing: Boolean(legacyEditing),
    }
  }, [beta?.form?.enhancedObjectDialog?.enabled, legacyEditing])

  return (
    <NestedObjectDialogContext.Provider value={value}>
      {children}
    </NestedObjectDialogContext.Provider>
  )
}
