import type {Path} from '@sanity/types'
import type {UserColor} from '@sanity/base/user-color'
import {useUserColorManager} from '@sanity/base/user-color'
import type {Annotation, Diff} from '../../types'
import {getAnnotationColor, getAnnotationAtPath} from './helpers'

export function useAnnotationColor(annotation?: Annotation | null): Readonly<UserColor> {
  const userColorManager = useUserColorManager()
  return getAnnotationColor(userColorManager, annotation)
}

export function useDiffAnnotationColor(diff: Diff, path: string | Path = []): Readonly<UserColor> {
  const userColorManager = useUserColorManager()
  const annotation = getAnnotationAtPath(diff, path)
  return getAnnotationColor(userColorManager, annotation)
}
