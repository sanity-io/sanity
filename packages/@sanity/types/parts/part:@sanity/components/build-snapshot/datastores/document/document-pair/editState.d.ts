import {Observable} from 'rxjs'
import {IdPair, SanityDocument} from '../types'
export interface EditStateFor {
  id: string
  type: string
  draft: null | SanityDocument
  published: null | SanityDocument
}
export declare const editState: (arg1: IdPair, arg2: string) => Observable<EditStateFor>
