// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {Observable, Subject} from 'rxjs'
import {map, publishReplay, refCount, startWith, tap, take} from 'rxjs/operators'
import {ObjectField, SchemaType} from '@sanity/types'
import {castArray} from 'lodash'

export type SelectedTabName = string

const onSelect$ = new Subject<SelectedTabName>()

export const setSelectedTabName = (name: SelectedTabName) => onSelect$.next(name)

const DEFAULT_TAB = 'all-fields'

export const selectedTab$ = onSelect$.pipe(startWith(DEFAULT_TAB), publishReplay(1), refCount())

const defaultFilterField = (enclosingType: SchemaType, field: ObjectField, selectedTab: string) =>
  !selectedTab ||
  selectedTab === 'all-fields' ||
  (field.group && castArray(field.group).includes(selectedTab))

const filterField = defaultFilterField

export const filterFn$ = selectedTab$.pipe(
  // eslint-disable-next-line no-console
  tap(console.log),
  map((tabId) => {
    return (enclosingType: SchemaType, field: ObjectField) => {
      // Make sure we only filter on document level fields
      if (enclosingType.type.name !== 'document') {
        return true
      }

      return filterField(enclosingType, field, tabId)
    }
  })
)
