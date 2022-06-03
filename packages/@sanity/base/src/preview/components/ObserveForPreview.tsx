import {PreviewValue, SanityDocumentLike, SchemaType} from '@sanity/types'
import React, {ReactElement} from 'react'
import {withPropsStream} from 'react-props-stream'
import shallowEquals from 'shallow-equals'
import {distinctUntilChanged, map, publishReplay, refCount, switchMap} from 'rxjs/operators'
import {concat, of, Observable} from 'rxjs'
import type {Previewable, SortOrdering} from '../types'
import {ObserveForPreviewFn} from '../documentPreviewStore'
import {useDocumentPreviewStore} from '../../datastores'
import {_memoizeBy} from './_helpers'

export interface ObserveForPreviewProps {
  children: (props: {
    error?: Error
    isLoading: boolean
    result: {type: SchemaType; snapshot: SanityDocumentLike | PreviewValue | null | undefined}
  }) => ReactElement
  isActive: boolean

  ordering?: SortOrdering
  schemaType: SchemaType
  value: Previewable
}

interface ReceivedProps {
  snapshot: PreviewValue | null | undefined
  type: SchemaType
  isLoading: boolean
  error?: Error
  children: (props: {
    error?: Error
    isLoading: boolean
    result: {type: SchemaType; snapshot: PreviewValue | null | undefined}
  }) => ReactElement
}

const connect = (
  props$: Observable<ObserveForPreviewProps & {observeForPreview: ObserveForPreviewFn}>
): Observable<ReceivedProps> => {
  const sharedProps$ = props$.pipe(publishReplay(1), refCount())

  const isActive$ = sharedProps$.pipe(map((props) => props.isActive !== false))

  return sharedProps$.pipe(
    distinctUntilChanged((props, nextProps) => shallowEquals(props.value, nextProps.value)),
    switchMap((props) =>
      concat(
        of<ReceivedProps>({
          isLoading: true,
          type: props.schemaType,
          snapshot: null,
          children: props.children,
        }),
        props
          .observeForPreview(
            props.value,
            props.schemaType,
            props.ordering ? {ordering: props.ordering} : {}
          )
          .pipe(
            map((result) => ({
              isLoading: false,
              type: props.schemaType,
              snapshot: result.snapshot,
              children: props.children,
            }))
          )
      )
    ),
    _memoizeBy(isActive$)
  )
}

const ObserveForPreviewInner = withPropsStream<
  ObserveForPreviewProps & {observeForPreview: ObserveForPreviewFn},
  ReceivedProps
>(connect, (props: ReceivedProps) => {
  const {type, error, snapshot, isLoading, children} = props

  return children({
    error,
    isLoading,
    result: {type, snapshot},
  })
})

export function ObserveForPreview(props: ObserveForPreviewProps) {
  const documentPreviewStore = useDocumentPreviewStore()

  return (
    <ObserveForPreviewInner {...props} observeForPreview={documentPreviewStore.observeForPreview} />
  )
}
