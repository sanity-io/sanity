import {Observable} from 'rxjs'
import {IdPair} from '../types'
declare type Marker = any
export interface ValidationStatus {
  isValidating: boolean
  markers: Marker[]
}
export declare const validation: (arg1: IdPair, arg2: string) => Observable<ValidationStatus>
export {}
