// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {useRef, useEffect, useState, useMemo} from 'react'
import config from 'part:@sanity/language-filter/config'
import {SchemaType} from '@sanity/types'
import {Subscription} from 'rxjs'
import languageFilterImplementations from 'all:part:@sanity/desk-tool/language-select-component'
import {selectedLanguages$, setLangs} from './datastore'
import SelectLanguage from './SelectLanguage'

interface Props {
  schemaType?: SchemaType
}

const SelectLanguageProvider = ({schemaType}: Props) => {
  const subscriptionRef$ = useRef<Subscription | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [currentDocumentType, setCurrentDocumentType] = useState<string | undefined>()
  const shouldShow = useMemo(() => {
    const {documentTypes} = config
    return !!(documentTypes && schemaType?.name && documentTypes.includes(schemaType.name))
  }, [schemaType])
  const FallbackImplementation = useMemo(() => {
    if (languageFilterImplementations && Array.isArray(languageFilterImplementations)) {
      return (
        languageFilterImplementations?.filter(
          (component) => SelectLanguageProvider !== component
        )?.[0] ?? null
      )
    }
    return null
  }, [])

  useEffect(() => {
    setCurrentDocumentType(schemaType?.name)
  }, [schemaType])

  useEffect(() => {
    subscriptionRef$.current = selectedLanguages$.subscribe((selectedLangs: string[]) => {
      setSelected(selectedLangs)
    })
    return () => {
      if (subscriptionRef$.current) {
        subscriptionRef$.current.unsubscribe()
      }
    }
  }, [])

  if (shouldShow) {
    return (
      <SelectLanguage
        languages={config.supportedLanguages}
        defaultLanguages={config.defaultLanguages}
        documentTypes={config.documentTypes}
        currentDocumentType={currentDocumentType}
        selected={selected}
        onChange={setLangs}
      />
    )
  }

  if (FallbackImplementation) {
    return <FallbackImplementation schemaType={schemaType} />
  }

  return null
}

export default SelectLanguageProvider
