import {Observable} from 'rxjs'
import {OperationsAPI} from './operations'
import {IdPair} from '../types'
export declare function emitOperation(
  operationName: keyof OperationsAPI,
  idPair: IdPair,
  typeName: string,
  extraArgs: any[]
): void
export interface OperationError {
  type: 'error'
  op: keyof OperationsAPI
  id: string
  error: Error
}
export interface OperationSuccess {
  type: 'success'
  op: keyof OperationsAPI
  id: string
}
export declare const operationEvents: (
  arg1: IdPair,
  arg2: string
) => Observable<OperationError | OperationSuccess>
