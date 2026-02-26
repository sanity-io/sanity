import {type SanityClient} from '@sanity/client'
import {type Observable, shareReplay} from 'rxjs'

let cachedSystemGroups$: Observable<any> | null = null
let cachedClientRef: unknown = null

export function getSystemGroups$(client: SanityClient['observable']): Observable<any> {
  if (cachedSystemGroups$ && cachedClientRef === client) {
    return cachedSystemGroups$
  }
  cachedClientRef = client
  cachedSystemGroups$ = client
    .fetch('*[_type == "system.group"]{members, grants}')
    .pipe(shareReplay(1))
  return cachedSystemGroups$
}
