import {createContext} from 'react'
import {BehaviorSubject} from 'rxjs'

/** @internal */
export type PortableTextEditorElement = HTMLDivElement | HTMLSpanElement

/**
 * @internal
 */
export const PortableTextMemberItemElementRefsContext = createContext<
  BehaviorSubject<Record<string, PortableTextEditorElement | null | undefined>>
>(new BehaviorSubject({}))
