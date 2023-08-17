import {Path} from '@sanity/types'
import {useMemo} from 'react'
import {UserColor, useUserColorManager} from '../../../user-color'
import {Annotation, Diff} from '../../types'
import {getAnnotationColor, getAnnotationAtPath} from './helpers'

/** @internal */
export function useAnnotationColor(annotation?: Annotation | null): UserColor {
  const userColorManager = useUserColorManager()

  return getAnnotationColor(userColorManager, annotation)
}

/** @internal */
export function useDiffAnnotationColor(diff: Diff, path: string | Path = []): UserColor {
  const userColorManager = useUserColorManager()
  const annotation = useMemo(() => getAnnotationAtPath(diff, path), [diff, path])

  return useMemo(
    () => getAnnotationColor(userColorManager, annotation),
    [annotation, userColorManager],
  )
}
