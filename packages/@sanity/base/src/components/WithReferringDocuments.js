import documentStore from 'part:@sanity/base/datastore/document'
import {withPropsStream} from 'react-props-stream'
import {concat, of} from 'rxjs'
import {distinctUntilChanged, map, switchMap} from 'rxjs/operators'

const loadProps = receivedProps$ =>
  receivedProps$.pipe(
    distinctUntilChanged((prev, next) => prev.id === next.id),
    switchMap(receivedProps =>
      concat(
        of({...receivedProps, referringDocuments: [], isLoading: true}),
        documentStore.query('*[references($docId)] [0...101]', {docId: receivedProps.id}).pipe(
          map(event => ({
            ...receivedProps,
            referringDocuments: event.documents,
            isLoading: false
          }))
        )
      )
    )
  )

export const WithReferringDocuments = withPropsStream(loadProps, ({children, ...props}) =>
  children(props)
)
