import {type ArraySchemaType} from '@sanity/types'
import {type ReactNode, useContext, useMemo} from 'react'
import {ArrayValidationContext} from 'sanity/_singletons'

import {getValidationRule} from '../../../utils/getValidationRule'

/** @internal */
export interface ArrayValidationState {
  maxReached: boolean
}

interface ArrayValidationProviderProps {
  children: ReactNode
  schemaType: ArraySchemaType
  itemCount: number
}

/** @internal */
export function ArrayValidationProvider(props: ArrayValidationProviderProps) {
  const {children, schemaType, itemCount} = props

  // Separated from the value memo so rule extraction only re-runs when schemaType changes
  const maxRule = useMemo(() => getValidationRule(schemaType, 'max'), [schemaType])

  const value = useMemo((): ArrayValidationState => {
    const maxConstraint = maxRule?.constraint

    return {
      maxReached: typeof maxConstraint === 'number' && itemCount >= maxConstraint,
    }
  }, [maxRule, itemCount])

  return <ArrayValidationContext.Provider value={value}>{children}</ArrayValidationContext.Provider>
}

/** @internal */
export function useArrayValidation(): ArrayValidationState | null {
  return useContext(ArrayValidationContext)
}
