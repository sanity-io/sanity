import {SanityDocument} from '@sanity/types'
import {withPropsStream} from 'react-props-stream'
import {concat, Observable, of} from 'rxjs'
import {distinctUntilChanged, map, switchMap} from 'rxjs/operators'
import {DocumentStore} from '../datastores'

export const WithReferringDocuments = withPropsStream(
  connect,
  function _WithReferringDocuments({children, ...props}) {
    return children(props)
  }
)

function connect(
  receivedProps$: Observable<{
    children: (props: {
      documentStore: DocumentStore
      id: string
      isLoading: boolean
      referringDocuments: SanityDocument[]
    }) => React.ReactElement
    documentStore: DocumentStore
    id: string
  }>
) {
  return receivedProps$.pipe(
    distinctUntilChanged((prev, next) => prev.id === next.id),
    switchMap((receivedProps) =>
      concat(
        of({...receivedProps, referringDocuments: [], isLoading: true}),
        receivedProps.documentStore
          .listenQuery(
            '*[references($docId)] [0...101]',
            {docId: receivedProps.id},
            {tag: 'with-referring-documents'}
          )
          .pipe(
            map((docs: any[]) => ({
              ...receivedProps,
              referringDocuments: docs,
              isLoading: false,
            }))
          )
      )
    )
  )
}
