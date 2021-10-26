import {Observable} from 'rxjs'
import {distinctUntilChanged, map} from 'rxjs/operators'
import {observePaths} from './index'

export function observeDocumentTypeFromId(id: string): Observable<string | undefined> {
  return observePaths(id, ['_type']).pipe(
    map((res) => res?._type as string | undefined),
    distinctUntilChanged()
  )
}
