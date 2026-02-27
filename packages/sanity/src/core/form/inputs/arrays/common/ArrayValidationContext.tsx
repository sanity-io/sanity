import {type ArraySchemaType} from '@sanity/types'
import {type ReactNode, useContext, useMemo} from 'react'
import {ArrayValidationContext} from 'sanity/_singletons'

import {useTranslation} from '../../../../i18n'
import {getValidationRule} from '../../../utils/getValidationRule'

/** @internal */
export interface ArrayValidationState {
  maxReached: boolean
  maxReachedReason: string | undefined
}

interface ArrayValidationProviderProps {
  children: ReactNode
  schemaType: ArraySchemaType
  itemCount: number
}

/** @internal */
export function ArrayValidationProvider(props: ArrayValidationProviderProps) {
  const {children, schemaType, itemCount} = props
  const {t} = useTranslation()

  // Separated from the value memo so rule extraction only re-runs when schemaType changes
  const maxRule = useMemo(() => getValidationRule(schemaType, 'max'), [schemaType])

  const value = useMemo((): ArrayValidationState => {
    const maxConstraint = maxRule?.constraint
    const maxReached = typeof maxConstraint === 'number' && itemCount >= maxConstraint

    return {
      maxReached,
      maxReachedReason: maxReached ? t('inputs.array.action.max-reached') : undefined,
    }
  }, [maxRule, itemCount, t])

  return <ArrayValidationContext.Provider value={value}>{children}</ArrayValidationContext.Provider>
}

/** @internal */
export function useArrayValidation(): ArrayValidationState | null {
  return useContext(ArrayValidationContext)
}
