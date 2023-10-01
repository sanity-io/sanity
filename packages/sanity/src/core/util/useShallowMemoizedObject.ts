import {useRef, useMemo} from 'react'
import shallowEquals from 'shallow-equals'

/**
 * Performs a shallow equality check between the given object and the object
 * from the previous render cycle. Returns the previous object if they are
 * shallowly equal; otherwise, returns the new object.
 *
 * @param obj - The object to be memoized.
 * @returns A memoized version of the provided object, based on a shallow
 * equality check.
 * @internal
 */
export function useShallowMemoizedObject<TObject extends object>(obj: TObject): TObject {
  const prev = useRef<TObject | null>(null)

  const memoizedObj = useMemo(() => {
    if (prev.current && shallowEquals(prev.current, obj)) return prev.current

    prev.current = obj
    return obj
  }, [obj])

  return memoizedObj
}
