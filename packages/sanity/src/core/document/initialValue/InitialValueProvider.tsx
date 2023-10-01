import React from 'react'
import {useInitialValue} from '../../store'
import {useDocumentId} from '../useDocumentId'
import {useDocumentType} from '../useDocumentType'
import {InitialValueContext} from './InitialValueContext'

/** @internal */
export interface InitialValueProviderProps {
  templateName: string | undefined
  templateParams: Record<string, unknown> | undefined
  children: React.ReactNode
  fallback: React.ReactNode
}

/** @internal */
export function InitialValueProvider({
  children,
  fallback,
  templateParams,
  templateName,
}: InitialValueProviderProps) {
  const documentId = useDocumentId()
  const documentType = useDocumentType()

  const {value, error} = useInitialValue({
    documentId,
    documentType,
    templateName,
    templateParams,
  })
  if (error) throw error
  if (!value) return <>{fallback}</>

  return <InitialValueContext.Provider value={value}>{children}</InitialValueContext.Provider>
}
