import {type Path} from '@sanity/types'
import {useMemo} from 'react'

import {type UserColor, useUserColorManager} from '../../../user-color'
import {type Annotation, type Diff} from '../../types'
import {getAnnotationAtPath, getAnnotationColor} from './helpers'

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
