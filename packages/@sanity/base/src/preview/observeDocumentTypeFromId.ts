import {Observable} from 'rxjs'
import {distinctUntilChanged, map} from 'rxjs/operators'
import {ApiConfig} from './types'
import {observePaths} from './index'

export function observeDocumentTypeFromId(
  id: string,
  apiConfig?: ApiConfig
): Observable<string | undefined> {
  return observePaths(id, ['_type'], apiConfig).pipe(
    map((res) => res?._type as string | undefined),
    distinctUntilChanged()
  )
}
