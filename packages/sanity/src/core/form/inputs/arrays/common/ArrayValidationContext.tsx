import {createContext, type ReactNode, useContext, useMemo} from 'react'

import {getValidationRule} from '../../../utils/getValidationRule'
import {type ArraySchemaType} from '@sanity/types'

interface ArrayValidationState {
  /** Whether adding more items would exceed the max validation rule */
  maxReached: boolean
}

const ArrayValidationContext = createContext<ArrayValidationState | null>(null)

interface ArrayValidationProviderProps {
  children: ReactNode
  /** The array schema type containing validation rules */
  schemaType: ArraySchemaType
  /** Current number of items in the array */
  itemCount: number
}

/**
 * Provider that exposes array validation state to child components.
 * Used to determine if insert operations should be disabled.
 *
 * @internal
 */
export function ArrayValidationProvider(props: ArrayValidationProviderProps) {
  const {children, schemaType, itemCount} = props

  const value = useMemo((): ArrayValidationState => {
    const maxRule = getValidationRule(schemaType, 'max')
    const maxConstraint = maxRule?.constraint

    return {
      maxReached: typeof maxConstraint === 'number' && itemCount >= maxConstraint,
    }
  }, [schemaType, itemCount])

  return <ArrayValidationContext.Provider value={value}>{children}</ArrayValidationContext.Provider>
}

/**
 * Hook to access array validation state.
 * Returns null if used outside of ArrayValidationProvider.
 *
 * @internal
 */
export function useArrayValidation(): ArrayValidationState | null {
  return useContext(ArrayValidationContext)
}
