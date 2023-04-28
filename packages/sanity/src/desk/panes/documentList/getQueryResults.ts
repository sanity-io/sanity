import {SanityClient} from '@sanity/client'
import deepEquals from 'react-fast-compare'
import {
  catchError,
  distinctUntilChanged,
  map,
  mergeMapTo,
  startWith,
  switchMap,
  take,
  scan,
  share,
  publishReplay,
  refCount,
} from 'rxjs/operators'
import {concat, merge, of, fromEvent, Observable, Subject} from 'rxjs'
import {SanityDocument} from '@sanity/types'

const INITIAL_CHILD_PROPS = {
  result: null,
  error: false,
}

const createResultChildProps = (documents: SanityDocument[]) => ({
  result: {documents},
  error: false,
})

const createErrorChildProps = (error: Error) => ({
  result: null,
  error,
})

export const getQueryResults = (
  receivedProps$: Observable<{client: SanityClient; query: string; params: Record<string, any>}>,
  options = {}
) => {
  const onRetry$ = new Subject()
  const onRetry = onRetry$.next.bind(onRetry$)

  const queryProps$ = receivedProps$.pipe(
    map((props) => ({client: props.client, query: props.query, params: props.params})),
    distinctUntilChanged(deepEquals),
    publishReplay(1),
    refCount()
  )

  const queryResults$ = queryProps$.pipe(
    switchMap((queryProps) => {
      const query$ = queryProps.client.observable
        .fetch(queryProps.query, queryProps.params, options)
        .pipe(map(createResultChildProps), share())

      return query$
    })
  )

  return queryResults$.pipe(
    startWith(INITIAL_CHILD_PROPS),
    catchError((err, caught$) =>
      concat(
        of(createErrorChildProps(err)),
        merge(fromEvent(window, 'online'), onRetry$).pipe(take(1), mergeMapTo(caught$))
      )
    ),
    scan((prev, next) => ({...prev, ...next, onRetry}))
  )
}
