import {Observable} from 'rxjs'
import {IdPair} from '../types'
import {OperationsAPI} from './operations'
export declare const editOperations: (arg1: IdPair, arg2: string) => Observable<OperationsAPI>
