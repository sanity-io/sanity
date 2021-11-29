// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {useRef, useEffect, useState} from 'react'
import config from 'part:@sanity/language-filter/config'
import type {SchemaType} from '@sanity/types'
import type {Subscription} from 'rxjs'
import {selectedLanguages$, setLangs} from './datastore'
import SelectLanguage from './SelectLanguage'

interface Props {
  schemaType?: SchemaType
}

const SelectLanguageProvider = ({schemaType}: Props) => {
  const subscriptionRef$ = useRef<Subscription | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [currentDocumentType, setCurrentDocumentType] = useState<string | undefined>()

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

export default SelectLanguageProvider
