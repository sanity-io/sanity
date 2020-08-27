import {UserColor, useUserColorManager} from '@sanity/base/user-color'
import {Annotation, Diff, Path} from '../types'
import {getAnnotationColor, getAnnotationForPath} from './helpers'

export function useAnnotationColor(annotation: Annotation): Readonly<UserColor> {
  const userColorManager = useUserColorManager()
  return getAnnotationColor(userColorManager, annotation)
}

export function useDiffAnnotationColor(
  diff: Diff,
  path: string | Path = []
): Readonly<UserColor> | undefined {
  const userColorManager = useUserColorManager()
  const annotation = getAnnotationForPath(diff, path)
  return getAnnotationColor(userColorManager, annotation)
}
