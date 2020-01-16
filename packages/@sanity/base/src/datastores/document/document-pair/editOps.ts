/* eslint-disable @typescript-eslint/no-use-before-define */
import {combineLatest, concat, of} from 'rxjs'
import {map, switchMap} from 'rxjs/operators'
import schema from 'part:@sanity/base/schema'
import {snapshotPair} from './snapshotPair'
import {IdPair, OperationArgs} from '../types'
import * as operations from './operations'

const GUARDED = createOperationsAPI((op, opName) => {
  return {
    disabled: true,
    execute: createOperationGuard(opName)
  }
})

export function editOpsOf(idPair: IdPair, typeName: string) {
  const schemaType = schema.get(typeName)
  const liveEdit = !!schemaType.liveEdit

  return concat(
    of(GUARDED),
    snapshotPair(idPair).pipe(
      switchMap(versions =>
        combineLatest([versions.draft.snapshots$, versions.published.snapshots$]).pipe(
          map(
            ([draft, published]): OperationArgs => ({
              idPair,
              typeName: typeName,
              snapshots: {draft, published},
              versions,
              liveEdit
            })
          )
        )
      ),
      map((args: OperationArgs) => {
        return createOperationsAPI((op, opName) => {
          const disabled = op.disabled(args)
          return {
            disabled,
            execute: disabled ? GUARDED[opName] : (...callerArgs) => op.execute(args, ...callerArgs)
          }
        })
      })
    )
  )
}

function createOperationsAPI(cb) {
  return Object.keys(operations).reduce((acc, opName) => {
    const op = operations[opName]
    acc[opName] = cb(op)
    return acc
  }, {})
}

function createOperationGuard(opName) {
  return () => {
    throw new Error(`Called ${opName} when it was disabled`)
  }
}
