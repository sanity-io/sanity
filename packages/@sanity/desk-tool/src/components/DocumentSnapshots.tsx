import {streamingComponent} from 'react-props-stream'
import {map, switchMap, scan, filter} from 'rxjs/operators'
import {merge, Observable} from 'rxjs'
import {observePaths} from 'part:@sanity/base/preview'
import {getDraftId, getPublishedId} from 'part:@sanity/base/util/draft-utils'

export interface DocumentSnapshotsProps {
  id: string
  paths: string[]
  children: (props: {draft: Record<string, any>; published: Record<string, any>}) => React.ReactNode
}

const DocumentSnapshots = streamingComponent((props$: Observable<DocumentSnapshotsProps>) => {
  return props$.pipe(
    switchMap((props) =>
      merge(
        observePaths(getDraftId(props.id), props.paths).pipe(map((draft) => ({draft}))),
        observePaths(getPublishedId(props.id), props.paths).pipe(map((published) => ({published})))
      ).pipe(
        scan((prev, res) => ({...prev, ...res}), {}),
        filter((res) => 'draft' in res && 'published' in res),
        map((res) => props.children(res as any))
      )
    )
  )
})

export default DocumentSnapshots
