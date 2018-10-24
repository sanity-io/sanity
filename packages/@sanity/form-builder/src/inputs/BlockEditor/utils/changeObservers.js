import {Subject} from 'rxjs'
import {merge} from 'rxjs/operators'

export const localChanges$ = new Subject()

export const remoteChanges$ = new Subject()

export const changes$ = localChanges$.pipe(merge(remoteChanges$))
