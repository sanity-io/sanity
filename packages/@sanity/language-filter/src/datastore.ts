// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {Observable, Subject} from 'rxjs'
import {map, publishReplay, refCount, startWith, tap} from 'rxjs/operators'
import config from 'part:@sanity/language-filter/config'
import {intersection, union} from 'lodash'
import {ObjectField, SchemaType} from '@sanity/types'

export type SelectedLanguages = string[]
interface SupportedLanguage {
  id: string
  title: string
}

const onSelect$ = new Subject<SelectedLanguages>()

const id = (v: any) => v

export const setLangs = (languages: SelectedLanguages) => onSelect$.next(languages)

const persistOn = (key: string, defaultValue: string[]) => (input$: Observable<string[]>) => {
  let persisted
  try {
    const persistedValue = window.localStorage.getItem(key)
    if (persistedValue) {
      persisted = JSON.parse(persistedValue)
    }
  } catch (err) {} // eslint-disable-line no-empty

  return input$.pipe(
    startWith(persisted || defaultValue),
    tap((value) => {
      window.localStorage.setItem(key, JSON.stringify(value))
    })
  )
}

const SUPPORTED_LANG_IDS = config.supportedLanguages.map((lang: SupportedLanguage) => lang.id)

export const selectedLanguages$ = onSelect$.pipe(
  persistOn(
    '@sanity/plugin/language-filter/selected-languages',
    config.defaultLanguages || SUPPORTED_LANG_IDS
  ),
  // constrain persisted/selected languages to the ones currently supported
  map((selectedLangs: SelectedLanguages) => intersection(selectedLangs, SUPPORTED_LANG_IDS)),
  // make sure default languages always gets selected
  Array.isArray(config.defaultLanguages)
    ? map((selectedLangs) => union(selectedLangs, config.defaultLanguages || []))
    : id,
  publishReplay(1),
  refCount()
)

const defaultFilterField = (
  enclosingType: SchemaType,
  field: ObjectField,
  selectedLanguages: string[]
) => !enclosingType.name.startsWith('locale') || selectedLanguages.includes(field.name)

const filterField = config.filterField || defaultFilterField

export const filterFn$ = selectedLanguages$.pipe(
  map((langs) => {
    return (enclosingType: SchemaType, field: ObjectField) => {
      return filterField(enclosingType, field, langs)
    }
  })
)
