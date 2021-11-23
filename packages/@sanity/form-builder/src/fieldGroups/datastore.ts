// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {Observable, Subject} from 'rxjs'
import {map, publishReplay, refCount, startWith, tap, take} from 'rxjs/operators'
// import {intersection, union} from 'lodash'
import {ObjectField, SchemaType} from '@sanity/types'

export type SelectedTabName = string

const onSelect$ = new Subject<SelectedTabName>()

const id = (v: any) => v

export const setSelectedTabName = (name: SelectedTabName) => onSelect$.next(name)

const persistOn = (key: string, defaultValue: string) => (input$: Observable<string>) => {
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

const DEFAULT_TAB = 'all-fields'

export const selectedTab$ = onSelect$.pipe(
  persistOn('@sanity/plugin/field-groups/selected-tab', DEFAULT_TAB),
  // constrain persisted/selected tab ids to the ones currently supported for this type
  // make sure default tab always gets selected
  publishReplay(1),
  refCount()
)

function ensureArray(value: any) {
  return Array.isArray(value) ? value : [value]
}

const defaultFilterField = (enclosingType: SchemaType, field: ObjectField, selectedTab: string) =>
  !selectedTab ||
  selectedTab === 'all-fields' ||
  (field.group && ensureArray(field.group).includes(selectedTab))

const filterField = defaultFilterField

export const filterFn$ = selectedTab$.pipe(
  // eslint-disable-next-line no-console
  tap(console.log),
  map((tabId) => {
    return (enclosingType: SchemaType, field: ObjectField) => {
      if (enclosingType.type.name !== 'document') {
        return true
      }

      console.log(enclosingType, field)
      return filterField(enclosingType, field, tabId)
    }
  })
)
