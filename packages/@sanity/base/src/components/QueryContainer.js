import {
  catchError,
  distinctUntilChanged,
  map,
  mergeMapTo,
  startWith,
  switchMap,
  take,
  scan,
  delay,
  takeUntil,
  share,
  publishReplay,
  refCount,
} from 'rxjs/operators'

import {combineLatest, concat, merge, of, fromEvent} from 'rxjs'
import deepEquals from 'react-fast-compare'
import {createEventHandler, streamingComponent} from 'react-props-stream'
import {listenQuery} from '../datastores/document/listenQuery'

const INITIAL_CHILD_PROPS = {
  result: null,
  error: false,
}

const createResultChildProps = (documents) => ({
  result: {documents},
  loading: false,
  error: false,
})

const createErrorChildProps = (error) => ({
  result: null,
  loading: false,
  error,
})

export const getQueryResults = (receivedProps$) => {
  const [onRetry$, onRetry] = createEventHandler()

  const queryProps$ = receivedProps$.pipe(
    map((props) => ({query: props.query, params: props.params})),
    distinctUntilChanged(deepEquals),
    publishReplay(1),
    refCount()
  )

  const queryResults$ = queryProps$.pipe(
    switchMap((queryProps) => {
      const query$ = listenQuery(queryProps.query, queryProps.params).pipe(
        map(createResultChildProps),
        share()
      )
      return merge(of({loading: true}).pipe(delay(400), takeUntil(query$)), query$)
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

// todo: split into separate standalone parts so that behavior can be re-used
export default streamingComponent((receivedProps$) => {
  const resultProps$ = getQueryResults(receivedProps$)
  return combineLatest(receivedProps$, resultProps$).pipe(
    map(([receivedProps, queryResult]) => {
      const {children, mapFn} = receivedProps
      if (typeof mapFn === 'function') {
        // eslint-disable-next-line no-console
        console.warn('The mapFn prop of the <QueryContainer/> is removed.')
      }

      return children(queryResult)
    })
  )
})
