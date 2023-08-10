import React, {useMemo} from 'react'
import {useSource} from '../studio'
import {LanguageFilterContext} from './context'

export function LanguageFilterProvider(props: {
  documentId: string
  documentType: string
  children: React.ReactNode
}) {
  const languageFilterResolver = useSource().document.unstable_languageFilter
  // Resolve document language filter
  const languageFilterComponents = useMemo(
    () => languageFilterResolver({schemaType: props.documentType, documentId: props.documentId}),
    [props.documentId, props.documentType, languageFilterResolver]
  )
  return (
    <LanguageFilterContext.Provider value={languageFilterComponents}>
      {props.children}
    </LanguageFilterContext.Provider>
  )
}
