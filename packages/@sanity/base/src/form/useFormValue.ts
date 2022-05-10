import {Path, SanityDocument} from '@sanity/types'
import {isEqual} from 'lodash'
import {useEffect, useMemo, useState} from 'react'
import {Subject} from 'rxjs'
import {distinctUntilChanged, map} from 'rxjs/operators'
import {getValueAtPath} from '../field/paths'
import {useUnique} from '../util'
import {useFormBuilder} from './useFormBuilder'

/**
 * @alpha
 */
export function useFormValue(path: Path): unknown {
  const uniquePath = useUnique(path)
  const {getDocument, patchChannel} = useFormBuilder().__internal
  const documentValueSubject = useMemo(() => new Subject<SanityDocument | undefined>(), [])
  const documentValue$ = useMemo(() => documentValueSubject.asObservable(), [documentValueSubject])
  const [value, setValue] = useState(() => getValueAtPath(getDocument(), uniquePath))

  // Subscribe to all document changes
  useEffect(
    () => patchChannel.subscribe(() => documentValueSubject.next(getDocument())),
    [documentValueSubject, getDocument, patchChannel]
  )

  // Subscribe to value at `path`
  useEffect(() => {
    const value$ = documentValue$.pipe(
      map((documentValue) =>
        uniquePath.length === 0 ? documentValue : getValueAtPath(documentValue, uniquePath)
      ),
      distinctUntilChanged((x, y) => isEqual(x, y))
    )

    const sub = value$.subscribe(setValue)

    return () => sub.unsubscribe()
  }, [documentValue$, uniquePath])

  return value
}
