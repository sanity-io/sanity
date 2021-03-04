import {Subject} from 'rxjs'
import {map, publishReplay, refCount, startWith, tap} from 'rxjs/operators'
import config from 'part:@sanity/language-filter/config'
import {intersection, union} from 'lodash'

const onSelect$ = new Subject()

const id = (v) => v

export const setLangs = (langs) => onSelect$.next(langs)

const persistOn = (key, defaultValue) => (input$) => {
  let persisted
  try {
    persisted = JSON.parse(window.localStorage.getItem(key))
  } catch (err) {} // eslint-disable-line no-empty

  return input$.pipe(
    startWith(persisted || defaultValue),
    tap((value) => {
      window.localStorage.setItem(key, JSON.stringify(value))
    })
  )
}

const SUPPORTED_LANG_IDS = config.supportedLanguages.map((lang) => lang.id)

export const selectedLanguages$ = onSelect$.pipe(
  persistOn(
    '@sanity/plugin/language-filter/selected-languages',
    config.defaultLanguages || SUPPORTED_LANG_IDS
  ),
  // constrain persisted/selected languages to the ones currently supported
  map((selectedLangs) => intersection(selectedLangs, SUPPORTED_LANG_IDS)),
  // make sure default languages always gets selected
  Array.isArray(config.defaultLanguages)
    ? map((selectedLangs) => union(selectedLangs, config.defaultLanguages || []))
    : id,
  publishReplay(1),
  refCount()
)

const defaultFilterField = (enclosingType, field, selectedLanguages) =>
  !enclosingType.name.startsWith('locale') || selectedLanguages.includes(field.name)

const filterField = config.filterField || defaultFilterField

export const filterFn$ = selectedLanguages$.pipe(
  map((langs) => {
    return (enclosingType, field) => filterField(enclosingType, field, langs)
  })
)
