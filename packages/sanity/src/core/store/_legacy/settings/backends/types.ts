import {Observable} from 'rxjs'

export interface Backend {
  get: (key: string, defValue: unknown) => Observable<unknown>
  set: (key: string, nextValue: unknown) => Observable<unknown>
}
