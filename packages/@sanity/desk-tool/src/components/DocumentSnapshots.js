import PropTypes from 'prop-types'
import {streamingComponent} from 'react-props-stream'
import {map, switchMap, scan, filter} from 'rxjs/operators'
import {merge} from 'rxjs'
import {observePaths} from 'part:@sanity/base/preview'
import {getDraftId, getPublishedId} from 'part:@sanity/base/util/draft-utils'

const DocumentSnapshots = streamingComponent(props$ => {
  return props$.pipe(
    switchMap(props =>
      merge(
        observePaths(getDraftId(props.id), props.paths).pipe(map(draft => ({draft}))),
        observePaths(getPublishedId(props.id), props.paths).pipe(map(published => ({published})))
      ).pipe(
        scan((prev, res) => ({...prev, ...res}), {}),
        filter(res => 'draft' in res && 'published' in res),
        map(res => props.children(res))
      )
    )
  )
})

DocumentSnapshots.propTypes = {
  id: PropTypes.string.isRequired,
  paths: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.func.isRequired
}

export default DocumentSnapshots
