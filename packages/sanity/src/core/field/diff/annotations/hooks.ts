import {type Path} from '@sanity/types'
import {useMemo} from 'react'

import {useUserColorManager} from '../../../user-color/hooks'
import {type UserColor} from '../../../user-color/types'
import {type Annotation, type Diff} from '../../types'
import {getAnnotationAtPath, getAnnotationColor} from './helpers'

/** @public */
export function useAnnotationColor(annotation?: Annotation | null): UserColor {
  const userColorManager = useUserColorManager()

  return getAnnotationColor(userColorManager, annotation)
}

/** @public */
export function useDiffAnnotationColor(diff: Diff, path: string | Path = []): UserColor {
  const userColorManager = useUserColorManager()
  const annotation = useMemo(() => getAnnotationAtPath(diff, path), [diff, path])

  return useMemo(
    () => getAnnotationColor(userColorManager, annotation),
    [annotation, userColorManager],
  )
}
