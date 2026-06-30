import {useCallback, useContext} from 'react'
import {useObservable} from 'react-rx'
import {
  type PortableTextEditorElement,
  PortableTextMemberItemElementRefsContext,
} from 'sanity/_singletons'

import {type PortableTextMemberItem} from '../PortableTextInput'

export type SetPortableTextMemberItemElementRef = ({
  key,
  elementRef,
}: {
  key: PortableTextMemberItem['key']
  elementRef: PortableTextEditorElement | null
}) => void

export function usePortableTextMemberItemElementRefs(): Record<
  PortableTextMemberItem['key'],
  PortableTextEditorElement | null | undefined
> {
  const behaviorSubject = useContext(PortableTextMemberItemElementRefsContext)

  return useObservable(behaviorSubject, {})
}

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
