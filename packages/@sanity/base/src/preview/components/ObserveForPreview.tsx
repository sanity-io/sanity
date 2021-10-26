import {PreviewValue, SchemaType} from '@sanity/types'
import React from 'react'
import {withPropsStream} from 'react-props-stream'
import shallowEquals from 'shallow-equals'
import {
  distinctUntilChanged,
  filter,
  map,
  publishReplay,
  refCount,
  switchMap,
  tap,
} from 'rxjs/operators'
import {concat, of, Observable} from 'rxjs'
import {observeForPreview} from '../'
import {FieldName, SortOrdering} from '../types'

function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}

// Will track a memo of the value as long as the isActive$ stream emits true,
// and emit the memoized value after it switches to to false

// (disclaimer: there's probably a better way to do this)
function memoizeBy<T>(isActive$: Observable<boolean>) {
  return (producer$: Observable<T>) => {
    let memo: T
    return isActive$.pipe(
      distinctUntilChanged(),
      switchMap(
        (isActive): Observable<T> =>
          isActive ? producer$.pipe(tap((v) => (memo = v))) : of(memo).pipe(filter(isNonNullable))
      )
    )
  }
}

type OuterProps = {
  isActive: boolean
  value: any
  type: SchemaType
  children: (props: any) => React.ReactElement
  fields: FieldName[]
  ordering?: SortOrdering
}
const connect = (props$: Observable<OuterProps>): Observable<ReceivedProps> => {
  const sharedProps$ = props$.pipe(publishReplay(1), refCount())

  const isActive$ = sharedProps$.pipe(map((props) => props.isActive !== false))

  return sharedProps$.pipe(
    distinctUntilChanged((props, nextProps) => shallowEquals(props.value, nextProps.value)),
    switchMap((props) =>
      concat(
        of<ReceivedProps>({
          isLoading: true,
          type: props.type,
          snapshot: null,
          children: props.children,
        }),
        observeForPreview(
          props.value,
          props.type,
          props.ordering ? {ordering: props.ordering} : {}
        ).pipe(
          map((result) => ({
            isLoading: false,
            type: props.type,
            snapshot: result.snapshot,
            children: props.children,
          }))
        )
      )
    ),
    memoizeBy(isActive$)
  )
}

type ReceivedProps = {
  snapshot: PreviewValue | null
  type: SchemaType
  isLoading: boolean
  error?: Error
  children: (props: any) => React.ReactElement
}
export default withPropsStream<OuterProps, ReceivedProps>(connect, function ObserveForPreview(
  props: ReceivedProps
) {
  const {type, error, snapshot, isLoading, children} = props

  return children({
    error,
    isLoading,
    result: {type, snapshot},
  })
})
