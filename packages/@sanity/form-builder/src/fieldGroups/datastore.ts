// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {Observable, Subject} from 'rxjs'
import {map, publishReplay, refCount, startWith, tap, take} from 'rxjs/operators'
import {ObjectField, SchemaType} from '@sanity/types'
import {castArray} from 'lodash'

export const DEFAULT_TAB = 'all-fields'
const onSelect$ = new Subject<SelectedTabName>()

export type SelectedTabName = string

export const selectedTab$ = onSelect$.pipe(startWith(DEFAULT_TAB), publishReplay(1), refCount())
export const setSelectedTabName = (name: SelectedTabName) => onSelect$.next(name)
export const resetSelectedTab = () => onSelect$.next(DEFAULT_TAB)

const filterField = (enclosingType: SchemaType, field: ObjectField, selectedTab: string) =>
  !selectedTab ||
  selectedTab === 'all-fields' ||
  (field.group && castArray(field.group).includes(selectedTab))

export const filterFn$ = selectedTab$.pipe(
  map((tabId) => {
    return (enclosingType: SchemaType, field: ObjectField) => {
      // eslint-disable-next-line no-console
      // console.log({enclosingType}, enclosingType.type.name, enclosingType.name)
      // Make sure we only filter on document level fields
      if (enclosingType.type.name !== 'document') {
        return true
      }

      return filterField(enclosingType, field, tabId)
    }
  })
)
