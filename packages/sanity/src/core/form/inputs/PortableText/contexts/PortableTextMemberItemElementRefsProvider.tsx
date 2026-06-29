import {useCallback, useContext} from 'react'
import {useObservable} from 'react-rx'
import {
  type PortableTextEditorElement,
  PortableTextMemberItemElementRefsContext,
} from 'sanity/_singletons'

/**
 * Update a registered element reference for a Portable Text member.
 *
 * `key` is the stringified full path of the member (see
 * `pathToString`). Path-keyed registration avoids `_key` collisions
 * between identically-keyed blocks in different containers.
 *
 * @internal
 */
export type SetPortableTextMemberItemElementRef = ({
  key,
  elementRef,
}: {
  key: string
  elementRef: PortableTextEditorElement | null
}) => void

/**
 * Returns the current map of registered element refs, keyed by
 * stringified member path.
 *
 * @internal
 */
export function usePortableTextMemberItemElementRefs(): Record<
  string,
  PortableTextEditorElement | null | undefined
> {
  const behaviorSubject = useContext(PortableTextMemberItemElementRefsContext)

  return useObservable(behaviorSubject, {})
}

/** @internal */
export function useSetPortableTextMemberItemElementRef(): SetPortableTextMemberItemElementRef {
  const behaviorSubject = useContext(PortableTextMemberItemElementRefsContext)

  return useCallback<SetPortableTextMemberItemElementRef>(
    ({key, elementRef}) => {
      behaviorSubject.next({
        ...behaviorSubject.value,
        [key]: elementRef,
      })
    },
    [behaviorSubject],
  )
}
